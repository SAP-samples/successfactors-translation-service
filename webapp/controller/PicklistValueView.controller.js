sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.m.MessageToast} MessageToast
     */
    function (Controller, JSONModel, MessageToast) {
        "use strict";

        return Controller.extend("picklistmanagement.controller.PicklistValueView", {
            onInit: function () {
                const aLanguages = sap.ui.getCore().getModel("languageModel").getProperty("/languages");
                this.getView().setModel(new JSONModel({
                    dateUNIX: undefined,
                    languages: aLanguages,
                }), "localModel");
                this.getRouter().getRoute("RouteViewValues").attachPatternMatched(this._onPicklistMatched, this);
            },

            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            getModel: function (sModelName) {
                return this.getView().getModel(sModelName);
            },

            labelFormatter: function (sValue) {
                return sValue.replace("label_", "");
            },

            onNavBack: function () {
                this.getRouter().navTo("RouteView1");
            },

            _onPicklistMatched: function (oEvent) {
                var picklistId = oEvent.getParameter("arguments").picklist_id;
                var effectiveStartDate = oEvent.getParameter("arguments").effectiveStartDate;

                if (!picklistId || !effectiveStartDate) {
                    this.getRouter().navTo("RouteView1");
                    return;
                }

                const sPath = `/PickListV2(effectiveStartDate=datetime'${effectiveStartDate.replace(".000Z", "")}',id='${picklistId}')`
                this.getView().bindElement(sPath);

                const aLanguages = this.getModel("localModel").getProperty("/languages");
                var oTable = this.byId("smarttable");
                const aCells = aLanguages.map(oLanguage => new sap.m.Input({
                    id: oLanguage.key,
                    value: `{${oLanguage.key}}`
                }));
                oTable.bindItems("values", new sap.m.ColumnListItem({
                    cells: aCells
                }));
            },

            date: function (oEvent) {
                // Handle the field change event here
                var effectivedate = oEvent.getParameter("value");

                this.getModel("localModel").setProperty("/dateUNIX", Math.floor(Date.parse(effectivedate) / 1000));
            },
            onTranslationSimple: function () {
                const oTable = this.getView().byId("smarttable");
                const oSubmitButton = this.getView().byId("submitButton");
                oTable.setBusy(true);
                oSubmitButton.setEnabled(false);

                const aTableItemContexts = oTable.getBinding("items").getContexts();
                const aPromises = [];

                aTableItemContexts.forEach((oContext => {
                    const oRowObject = oContext.getObject();
                    const aLanguagesToBeTranslated = [];
                    Object.keys(oRowObject).forEach(key => {
                        if (key.indexOf("label_") !== 0) return; // not a language label
                        if (!!oRowObject[key]) return; // already translated
                        if (key === "label_en_DEBUG") return; // ignore DEBUG
                        // check for default labels without language
                        if ((key.match(/_/g) || []).length < 2) return;

                        aLanguagesToBeTranslated.push(key.replace("label_", "").replace("_", "-"));
                    });

                    const sSource = oRowObject.label_en_US;
                    aLanguagesToBeTranslated.forEach((sLanguage => {
                        aPromises.push(
                            this._translate(sSource, sLanguage)
                                .then((json => {
                                    const sTargetProperty = "label_" + sLanguage.replace("-", "_");
                                    // write translated value back to model
                                    this.getModel().setProperty(sTargetProperty, json.data, oContext);
                                }).bind(this)));
                    }).bind(this));
                }).bind(this));

                Promise.all(aPromises).then(() => {
                    oTable.setBusy(false);
                    oSubmitButton.setEnabled(true);
                });
            },

            _translate: function (sSourceText, sTargetLanguageKey) {
                var destinationName = "Translation"; // Retrieve destination name from manifest or wherever appropriate
                var destinationUrl = "/dynamic_dest/" + destinationName;

                return fetch(destinationUrl + `/api/v1/translation`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        "sourceLanguage": "en-US",
                        "targetLanguage": sTargetLanguageKey,
                        "contentType": "text/plain",
                        "data": sSourceText,
                    }) // Convert the payload to a JSON string
                }).then(response => response.json());
            },

            onSubmit: function () {
                // check if new effective date is set
                if (!this.getModel("localModel").getProperty("/dateUNIX")) {
                    MessageToast.show("Please select new effective date first");
                    return;
                }
                const oModel = this.getModel();
                if (!oModel.hasPendingChanges()) {
                    MessageToast.show("No changes to submit");
                    return;
                }

                const aRawValueData = this.getView().byId("smarttable").getBinding("items").getContexts().map(context => context.getObject());
                const allowed = Object.keys(aRawValueData[0]).filter(key => {
                    if ((key === "status" || key === "externalCode" || key.indexOf("label_") === 0) && key !== "label_localized") {
                        return true;
                    } else {
                        return false;
                    }
                });

                // allow only values in allowlist above
                const aValueData = aRawValueData.map(oObject => {
                    let returnObject = {};
                    Object.keys(oObject).forEach(key => {
                        if (allowed.includes(key)) {
                            returnObject[key] = oObject[key];
                        }
                    });
                    return returnObject;
                });

                const id = this.getView().getBindingContext().getObject().id;
                const unixTimestamp = this.getModel("localModel").getProperty("/dateUNIX");

                const payload = {
                    "__metadata": {
                        "uri": "https://apisalesdemo2.successfactors.eu/odata/v2/PickListV2",
                        "type": "SFOData.PickListV2"
                    },
                    "id": id,
                    "status": "A",
                    "effectiveStartDate": "/Date(" + unixTimestamp + "000)/",
                    "values": {
                        "results": aValueData
                    }
                }
                var destinationName_upsert = "SFADMIN"; // Retrieve destination name from manifest or wherever appropriate
                var destinationUrl_upsert = "/dynamic_dest/" + destinationName_upsert;

                const requestOptions_create = {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json' // Set the content type based on your payload
                    },
                    body: JSON.stringify(payload) // Convert the payload to a JSON string
                };
                fetch(destinationUrl_upsert + `/odata/v2/upsert/`, requestOptions_create)
                    .then(_ =>  {
                        MessageToast.show("Changes submitted successfully");
                    })
                    .catch(error => {
                        // better error handling would be nice in a productive version :)
                        MessageToast.show("An error occured. Please check details in console.");
                        // Handle errors
                        console.error('Error:', error);
                    });
            }
        });
    });

