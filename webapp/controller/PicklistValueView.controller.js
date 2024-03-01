sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"

],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel) {
        "use strict";

        var unixTimestamp
        var US

        return Controller.extend("picklistmanagement.controller.PicklistValueView", {
            onInit: function () {
                this.getView().setModel(new JSONModel({
                    dateUNIX: undefined
                }), "localModel");
                this.getRouter().getRoute("RouteViewValues").attachPatternMatched(this._onPicklistMatched, this);
            },
            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },
            getModel: function (sModelName) {
                return this.getView().getModel(sModelName);
            },

            _onPicklistMatched: function (oEvent) {
                var picklistId = oEvent.getParameter("arguments").picklist_id;
                var effectiveStartDate = oEvent.getParameter("arguments").effectiveStartDate;

                if (!picklistId || !effectiveStartDate) {
                    this.getOwnerComponent().getRouter().navTo("RouteView1");
                    return;
                }

                const sPath = `/PickListV2(effectiveStartDate=datetime'${effectiveStartDate.replace(".000Z", "")}',id='${picklistId}')`
                this.getView().bindElement(sPath);

                var oTable = this.byId("smarttable");
                oTable.getBinding("items").refresh()
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
                return fetch(`/api/v1/translation`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json' // Set the content type based on your payload
                    },
                    body: JSON.stringify({
                        "sourceLanguage": "en-US",
                        "targetLanguage": sTargetLanguageKey,
                        "contentType": "text/plain",
                        "data": sSourceText
                    }) // Convert the payload to a JSON string
                }).then(response => response.json());
            },

            onSubmit: function () {
                // check if new effective date is set
                if (!this.getModel("localModel").getProperty("/dateUNIX")) {
                    sap.m.MessageToast.show("Please select new effective date first");
                    return;
                }
                const oModel = this.getModel();
                if (!oModel.hasPendingChanges()) {
                    sap.m.MessageToast.show("No changes to submit");
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

                debugger;

                const requestOptions_create = {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json' // Set the content type based on your payload
                    },
                    body: JSON.stringify(payload) // Convert the payload to a JSON string
                };
                fetch(`/odata/v2/upsert/`, requestOptions_create)
                    .then(response => response.json())
                    .then(json => {
                        // Handle the response if needed
                        console.log(json);
                    })
                    .catch(error => {
                        // Handle errors
                        console.error('Error:', error);
                    });
            }
        });
    });

