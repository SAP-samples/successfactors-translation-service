sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("picklistmanagement.controller.View1", {
            onInit: function () {

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
                var oList = this.byId("idPicklistTable");
                var oBinding = oList.getBinding("items");
                oBinding.filter(aFilters, "Application");
            },

            tableUpdateStarted: function (oEvent) {
                oEvent.getSource().setBusy(true);
            },

            tableUpdateFinished: function (oEvent) {
                oEvent.getSource().setBusy(false);
            }
        });
    });

