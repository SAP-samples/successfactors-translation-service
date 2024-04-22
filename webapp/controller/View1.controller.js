sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator, JSONModel) {
        "use strict";

        return Controller.extend("picklistmanagement.controller.View1", {
            onInit: function () {
                sap.ui.getCore().setModel(new JSONModel({}), "languageModel");
                this.byId("idPicklistTable").attachEventOnce("updateFinished", this.tableUpdateFinishedOnce, this);
            },

            handleItemPress: function (oEvent) {
                var oPicklistObject = oEvent.getSource().getBindingContext().getObject();
                this.getOwnerComponent().getRouter().navTo("RouteViewValues", {
                    picklist_id: oPicklistObject.id,
                    effectiveStartDate: oPicklistObject.effectiveStartDate.toJSON()
                });
            },

            onSearch: function (oEvent) {
                // add filter for search
                var aFilters = [];
                var sQuery = oEvent.getSource().getValue();
                if (sQuery && sQuery.length > 0) {
                    var filter = new Filter({
                        path: "id",
                        operator: FilterOperator.Contains,
                        value1: sQuery,
                        caseSensitive: false
                    });
                    aFilters.push(filter);
                }

                // update list binding
                this.byId("idPicklistTable").getBinding("items").filter(aFilters, "Application");
            },

            tableBusyTrue: function (oEvent) {
                oEvent.getSource().setBusy(true);
            },

            tableBusyFalse: function (oEvent) {
                oEvent.getSource().setBusy(false);
            },

            tableUpdateFinishedOnce: function (oEvent) {
                // "unbusy" table
                const oTable = oEvent.getSource();
                oTable.setBusy(false);

                // check for available langugages in this SFSF system
                const oOneItemContext = oTable.getBinding("items").getContexts()[0];
                if (!oOneItemContext) {
                    // table doesn't have items
                    return;
                }
                this.getView().getModel().read("values", {
                    context: oOneItemContext,
                    urlParameters: {
                        "$top": 1
                    },
                    success: function (oData) {
                        let aLanguages = Object.keys(oData.results[0]).filter(key => {
                            if (key.indexOf("label_") !== 0) return false;
                            if (key.indexOf("default") >= 0) return false;
                            if (key.indexOf("DEBUG") >= 0) return false;
                            if (key.indexOf("localized") >= 0) return false;
                            return true;
                        });
                        const iUsIndex = aLanguages.indexOf("label_en_US");
                        const swap = aLanguages[0];
                        aLanguages[0] = "label_en_US";
                        aLanguages[iUsIndex] = swap;
                        const aLanguageObjects = aLanguages.map(sLanguage => ({
                            key: sLanguage
                        }));
                        sap.ui.getCore().getModel("languageModel").setProperty("/languages", aLanguageObjects);
                    }.bind(this)
                });
            }
        });
    });

