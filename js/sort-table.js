/*global _, console, Polymer, alert, window, document, XMLHttpRequest, localStorage */
(function () {
    'use strict';
    Polymer('sort-table', {
        ready: function () {
            this.fields = [];
            this.values = [];
            this.pageCount = [];
            this.displayBounds = [0, 49];
            this.page = 1;
            this.maxPage = 1;
            this.prevPage = this.$.prevPage;
            this.nextPage = this.$.nextPage;
            this.submit = this.$.submit;
            this.addValueForm = this.$.addValueForm;
            this.storeName = "";
            this.currentSort = {"sort?": false, "col": undefined, "ascDesc": undefined};
            this.init('sort-table-storage', 'data.json');
        },

        // Initialize object, load data, set view
        init: function (name, fileURL) {
            var currentPage, that = this;
            that.storeName = name;
            that.loadJSONToStore(name, fileURL);
            window.addEventListener('hashchange', function () {
                currentPage = document.location.hash.substring(1);
                if (currentPage !== "" && currentPage > 0 && currentPage <= that.maxPage) {
                    that.page = currentPage;
                } else {
                    that.page = 1;
                }
                that.updateDisplayBounds();
                that.updateView();
            });
        },

        // Update view based on current state of local storage
        updateView: function () {
            this.updateTableFields(this.findStoreFields());
            this.setTableValuesWithBounds(this.findStoreValues());
            this.updateNavigation();
        },

        // Added to avoid syntax error with unexpected tokens
        checkJSON: function (data) {
            if (data === null || data === undefined) {
                return data;
            }
            return JSON.parse(data);
        },

        // Vanilla JS to load data from json file on server, update view on load or reload attempt
        loadJSONToStore: function (name, fileURL) {
            var data,
                that = this,
                request = new XMLHttpRequest(),
                root = (function () {
                    if (document.location.origin === 'undefined') {
                        document.location.origin = document.location.protocol + '//' + document.location.host;
                    }
                    return document.location.origin;
                }());

            fileURL = root + '/' + fileURL;

            if (localStorage[JSON.stringify(name)]) {
                console.log("Local storage already contains item " + name);
                this.updateView();
            } else {
                request.open('GET', fileURL, true);

                request.onload = function () {
                    if (request.status >= 200 && request.status < 400) {
                        data = request.responseText;
                        localStorage.setItem(JSON.stringify(name), data);
                        that.updateView();
                    } else {
                        console.log("Server returned an error for request");
                    }
                };

                request.onerror = function () {
                    console.log("Error loading " + fileURL);
                };

                request.send();
            }
        },

        // Read method for storage fields
        findStoreFields: function () {
            var temp = this.checkJSON(localStorage[JSON.stringify(this.storeName)]);
            return temp.fields;
        },

        // Read method for storage values
        findStoreValues: function () {
            var temp = this.checkJSON(localStorage[JSON.stringify(this.storeName)]);
            return temp.values;
        },

        // Update method for storage values
        updateStoreValues: function (updateData) {
            var data = this.checkJSON(localStorage.getItem(JSON.stringify(this.storeName)));
            data.values = updateData;
            localStorage.setItem(JSON.stringify(this.storeName),  JSON.stringify(data));
        },

        // Add single value to storage
        saveStoreValue: function () {
            var i, updateData = [],
                data = this.checkJSON(localStorage.getItem(JSON.stringify(this.storeName)));

            for (i = 0; i < this.addValueForm.length - 1; i += 1) {
                updateData.push(this.addValueForm[i].value);
            }

            data.values.push(updateData);
            localStorage.setItem(JSON.stringify(this.storeName), JSON.stringify(data));
            alert("Your item has been saved");
            this.updateView();
        },

        // Function to sort values in storage and update the view accordingly
        // Uses Underscore's sort method
        sortValues: function (inEvent) {
            var index = inEvent.target.getAttribute("data-sort"),
                valuesArray = this.findStoreValues();
            if (this.currentSort.col === undefined || this.currentSort.col !== index) {
                this.currentSort.col = index;
                this.currentSort.ascDesc = "asc";
                valuesArray = _(valuesArray).sortBy(index);
            } else {
                if (this.currentSort.ascDesc === "asc") {
                    this.currentSort.ascDesc = "desc";
                    valuesArray = valuesArray.reverse();
                } else {
                    this.currentSort.ascDesc = "asc";
                    valuesArray = _(valuesArray).sortBy(index);
                }
            }
            this.currentSort["sort?"] = true;
            this.updateStoreValues(valuesArray);
            this.updateView();
        },

        // Setter for the Polymer object's fields array
        updateTableFields: function (array) {
            this.fields = array;
        },

        // Setter for the Polymer object's values array, limited to the max 50
        // records needed for the current view
        updateTableValues: function (array) {
            this.values = array;
        },

        // Method used to slice the Polymer values based on the current page
        setTableValuesWithBounds: function (array) {
            this.updateTableValues(array.slice(this.displayBounds[0], (this.displayBounds[1] + 1)));
        },

        // Set Polymer object values array boundaries
        updateDisplayBounds: function () {
            this.displayBounds[0] = (this.page - 1) * 50;
            this.displayBounds[1] = ((this.page - 1) * 50) + 49;
        },

        // Changes state of navigation bar
        updateNavigation: function () {
            var prev, next, i,
                page = Number(this.page),

            // Sets number of pages needed to display all values
                valuesLength = (this.findStoreValues()).length,
                tempCount = (function () {
                    if (valuesLength % 50 === 0) {
                        return (valuesLength / 50);
                    }
                    return Math.floor(valuesLength / 50) + 1;
                }());

            // Uses an array to iterate through using Polymer for nav buttons
            for (i = 0; i < tempCount; i += 1) {
                this.pageCount[i] = i + 1;
            }

            this.maxPage = this.pageCount.length;
            if (page === 1) {
                prev = page;
                next = page + 1;
                this.prevPage.href = "#" + String(prev);
                this.nextPage.href = "#" + String(next);
                this.prevPage.style.pointerEvents = "none";
                this.nextPage.style.pointerEvents = "auto";
            } else if (page === Number(this.maxPage)) {
                prev = page - 1;
                next = page;
                this.prevPage.href = "#" + String(prev);
                this.nextPage.href = "#" + String(next);
                this.nextPage.style.pointerEvents = "none";
                this.prevPage.style.pointerEvents = "auto";
            } else {
                prev = page - 1;
                next = page + 1;
                this.prevPage.href = "#" + String(prev);
                this.nextPage.href = "#" + String(next);
                this.nextPage.style.pointerEvents = "auto";
                this.prevPage.style.pointerEvents = "auto";
            }
        }
    });
}());