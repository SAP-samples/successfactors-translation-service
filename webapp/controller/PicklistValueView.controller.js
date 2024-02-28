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
                var oOwnerComponent = this.getOwnerComponent();

                var oRouter = oOwnerComponent.getRouter();

                oRouter.getRoute("RouteViewValues").attachPatternMatched(this._onPicklistMatched, this);

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

            handleLoadItems: function (oEvent) {

                //    id = this.getView().byId('picklistid').getSelectedKey();
                //  console.log(id);

                var presseditem = oEvent.getParameters().selectedItem
                console.log(presseditem)
                console.log(presseditem.mProperties.key)
                // var bindingcontext = presseditem.getBindingContext().getPath
                // console.log(bindingcontext)


                var sPath = presseditem.getBindingContext().getPath();
                console.log(sPath)

                //  sPath = sPath.replace("/PickListV2","/")
                console.log(sPath)

                var oTable = this.byId("smarttable");
                console.log(oTable)

                this.getView().bindElement(sPath)
                oTable.getBinding("items").refresh()



                //Add Item
                //https://sapui5.hana.ondemand.com/sdk/#/api/sap.ui.model.odata.v2.ODataModel%23methods/create
                //https://sapui5.hana.ondemand.com/sdk/#/api/sap.ui.model.odata.v2.ODataListBinding%23methods/create

            },
            date: function (oEvent) {
                // Handle the field change event here
                var effectivedate = oEvent.getParameter("value");


                console.log(effectivedate)
                unixTimestamp = Math.floor(Date.parse(effectivedate) / 1000);

                console.log(unixTimestamp);

                // Do something with the new value or the model data
            },
            onTranslation: function (oEvent) {

                var oModel = this.getView().byId("items");
                console.log(oModel)
                var picklist_data = this.getView().byId("smarttable").getItems("items")
                console.log(picklist_data)
                var picklist_data2 = this.getView().byId("smarttable").getBinding("items").getContexts()
                console.log(picklist_data2)



                var aEntities = picklist_data
                console.log(aEntities);

                // Assuming you have a sap.m.Table instance named "table"
                var oTable = this.getView().byId("smarttable");

                // Get the array of items in the table
                var aItems = oTable.getItems();
                var oItemContext = oItem.getContext()
                var oModelObject = oItemContext.getObject()
                console.log(oModelObject)

                // Array to store column header texts
                var aColumnLabels = [];

                // Array to store the values of input fields
                var aValues = [];

                // Assuming the table has columns defined
                oTable.getColumns().forEach(function (oColumn) {
                    var sHeaderText = oColumn.getHeader().getText();
                    // Push the column header text into the array
                    aColumnLabels.push(sHeaderText);
                });


                aItems.forEach(function (oItem) {
                    // Get the cells of the column list item
                    var aCells = oItem.getCells();

                    var aRowValues = [];

                    aCells.forEach(function (oCell) {
                        // Check if the cell is an input field
                        if (oCell instanceof sap.m.Input) {
                            // Read the value of the input field
                            var sInputValue = oCell.getValue() || ''; // Use empty string if value is undefined
                            // Push the value to the array of row values
                            aRowValues.push(sInputValue);
                        } else {
                            // If the cell is not an input field, push an empty string to maintain the structure
                            aRowValues.push('');
                        }
                    });

                    // Push the array of row values to the main array
                    aValues.push(aRowValues);
                });

                // Combine column header texts and input field values into an array of objects
                var aData = [];
                aValues.forEach(function (aRowValues) {
                    var oData = {};
                    aColumnLabels.forEach(function (sColumnLabel, index) {
                        oData[sColumnLabel] = aRowValues[index] || ''; // Use empty string if value is undefined
                    });
                    aData.push(oData);
                });

                // Now aData contains objects where each object represents a row with column header texts as labels and corresponding input field values
                console.log("Data with column header texts as labels:", aData);

                oModel = this.getView().getModel();
                console.log(oModel)
                var context = oModel.getContexts()
                 console.log(context)

                var that = this

                aData.forEach(function (obj, rowIndex) {
                    for (var key in obj) {
                        if (!obj[key]) {
                            console.log("Empty field detected in row " + rowIndex + ", label: " + key);
                            var us_value = aData[rowIndex].English
                            console.log(us_value)
                            var row = rowIndex
                            console.log(row)
                            var language_key = key
                            console.log(language_key)
                            // Define your string mappings using a Map
                            const stringMappings = new Map([
                                ['da-DK', 'label_da_DK'],
                                ['key2', 'mappedValue2'],
                                ['key3', 'mappedValue3']
                            ]);
                            // Access the mapped value using the variable
                            var mappedValue = stringMappings.get(key);
                            console.log(mappedValue); // Output: mappedValue2



                            let payload2 = {
                                "sourceLanguage": "en-US",
                                "targetLanguage": key,
                                "contentType": "text/html",
                                "data": us_value
                            };
                            let requestOptions2 = {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json' // Set the content type based on your payload
                                },
                                body: JSON.stringify(payload2) // Convert the payload to a JSON string
                            };
                           
                            fetch(`/api/v1/translation`, requestOptions2)
                                .then(response => response.json())
                                .then(json => {
                                    // Handle the response if needed
                                    console.log(json);
                                    console.log(json.data)
                                    var dk1 = json.data
                                    var number = row + 1;
                                    console.log(number)

                                    aData[row][language_key] = dk1
                                    //that.dk1 = json.data;
                                    // Set the value of 'row1' property in the model
                                    //   oModel.setProperty("/values/" + index + "/label_zh_CN", dk1);
                                    oModel = that.getView().getModel();
                                    console.log("Modified aData:", aData);
                                    oModel.setProperty("values", aData);
                                })



                                .catch(error => {
                                    // Handle errors
                                    console.error('Error:', error);
                                })
                                ;

                        }
                    }
                });

                console.log(oModel)

            },


            setcode: function (oModel, entities, index) {
                console.log("Resolving 'four' for the entity at index:", index);
                US = US.replace(/\s/g, "");
                oModel.setProperty("/values/" + index + "/externalCode", US)
            },

            onSubmit: function () {

                // Assuming oModel is your model
                var sourceModel = this.getView().getModel(); // Replace with the actual name of your source model

                // Create a new array to hold the extracted values
                var targetArray = [];

                // Get the array from the source model
                var sourceArray = this.getView().byId("smarttable").getBinding("items").getContexts()
                sourceArray = sourceArray.filter(function (item) {
                    return Object.keys(item).length !== 0; // Keep only non-empty objects
                });

                // Loop through each element in the source array
                sourceArray.forEach(function (element) {
                    // Extract specific properties (status and externalCode) from each element
                    var extractedValues = {
                        status: element.status,
                        externalCode: element.externalCode,
                        label_ar_SA: element.label_ar_SA,
                        label_da_DK: element.label_da_DK,
                        label_de_DE: element.label_de_DE,
                        label_defaultValue: element.label_defaultValue,
                        label_en_DEBUG: element.label_en_DEBUG,
                        label_en_GB: element.label_en_GB,
                        label_en_US: element.label_en_US,
                        label_es_ES: element.label_es_ES,
                        label_fr_FR: element.label_fr_FR,
                        label_ja_JP: element.label_ja_JP,
                        label_ko_KR: element.label_ko_KR,
                        label_nl_NL: element.label_nl_NL,
                        label_pt_BR: element.label_pt_BR,
                        label_pt_PT: element.label_pt_PT,
                        label_ru_RU: element.label_ru_RU,
                        label_zh_CN: element.label_zh_CN,
                        label_zh_TW: element.label_zh_TW
                        // Add more properties if needed
                    };

                    // Push the extracted values to the target array
                    targetArray.push(extractedValues);
                });

                // Now, targetArray holds the extracted values from each element in the source array
                console.log(targetArray);



                var id = this.getView().getBindingContext().id
                console.log(id)


                // Create a payload object
                var payload = {
                    "__metadata": {
                        "uri": "https://apisalesdemo2.successfactors.eu/odata/v2/PickListV2",
                        "type": "SFOData.PickListV2"
                    },
                    "id": id,
                    "status": "A",
                    "effectiveStartDate": "/Date(" + unixTimestamp + "000)/",
                    "values": {
                        "results": targetArray

                    }
                }

                // Log the payload string to the console
                console.log(payload);

                let requestOptions_create = {
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

