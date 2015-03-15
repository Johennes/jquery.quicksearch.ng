(function($, window, document, undefined) {

    $.fn.quicksearch = function (target, opts) {
        var ifNonEmptyString = function(arg, callback) {
            if (typeof arg === "string" && arg !== "") {
                return callback();
            }
        };

        var timeout, textCache, rowCache, rowSpanCache, colSpanCache, val = "",
            e = this, rowSpanGroupAttrib = "data-quicksearch-rowspan-group",
            colSpanGroupAttrib = "data-quicksearch-colspan-group",
            options = $.extend({
                delay: 100,
                selector: null,
                rowSpanSelector: null,
                includeRowSpanText: false,
                groupRowSelector: null,
                stripeRows: null,
                loader: null,
                noResults: "",
                matchedResultsCount: 0,
                bind: "keyup",
                onBefore: function () {
                    return;
                },
                onAfter: function () {
                    return;
                },
                show: function () {
                    this.style.display = "";
                },
                hide: function () {
                    this.style.display = "none";
                },
                isHidden: function(node) {
                    return (node.style.display === "none");
                },
                prepareQuery: function (val) {
                    return val.toLowerCase().split(" ");
                },
                testQuery: function (query, txt, _row) {
                    for (var i = 0; i < query.length; i += 1) {
                        if (txt.indexOf(query[i]) === -1) {
                            return false;
                        }
                    }
                    return true;
                }
            }, opts);

        var handleRowSpan = ifNonEmptyString(options.rowSpanSelector, function() { return true; }) || false;
        var handleGroupRows = ifNonEmptyString(options.groupRowSelector, function() { return true; }) || false;

        var addToRowSpan = function($node, amount) {
            $node.attr("rowspan", parseInt($node.attr("rowspan")) + amount);
        };

        this.go = function () {
            var numMatchedRows = 0,
                noResults = true,
                query = options.prepareQuery(val),
                valEmpty = (val.replace(" ", "").length === 0);

            for (var i = 0, len = rowCache.length; i < len; i++) {
                if (valEmpty || options.testQuery(query, textCache[i], rowCache[i])) {
                    noResults = false;
                    numMatchedRows++;

                    if (!options.isHidden(rowCache[i])) { // Only show rows that are not visible
                        continue;
                    }

                    // Ignore group rows
                    if (handleGroupRows && $(rowCache[i]).find(options.groupRowSelector).length !== 0) {
                        continue;
                    }

                    options.show.apply(rowCache[i]);

                    if (handleRowSpan) {
                        handleRowSpanOnShow(i);
                    }

                    if (handleGroupRows) {
                        handleGroupRowsOnShow(i);
                    }
                } else {
                    if (options.isHidden(rowCache[i])) { // Only hide rows that are visible
                        continue;
                    }

                    // Ignore group rows
                    if (handleGroupRows && $(rowCache[i]).find(options.groupRowSelector).length !== 0) {
                        continue;
                    }

                    options.hide.apply(rowCache[i]);

                    if (handleRowSpan) {
                        handleRowSpanOnHide(i);
                    }

                    if (handleGroupRows) {
                        handleGroupRowsOnHide(i);
                    }
                }
            }

            if (noResults) {
                this.results(false);
            } else {
                this.results(true);
                this.stripe();
            }

            this.matchedResultsCount = numMatchedRows;
            this.loader(false);
            options.onAfter();

            return this;
        };

        var handleRowSpanOnShow = function(rowIndex) {
            var $row = $(rowCache[rowIndex]),
                group = $row.attr(rowSpanGroupAttrib);

            if (!rowSpanCache[group]) { // Now rowspan in this group
                return;
            }

            // Increment the group's rowspan
            var $rs = rowSpanCache[group].$rs;
            addToRowSpan($rs, 1);

            // Check if the rowspan is currently hidden or if any of the following
            // rows has the rowspan. If so, we move it to the shown row.
            if (options.isHidden(rowCache[rowSpanCache[group].row]) ||
                    rowSpanCache[group].row > rowIndex) {

                $rs.detach().prependTo($row);
                rowSpanCache[group].row = rowIndex;
                // TODO: This will only work if the rowspan element is the first
                // child inside the row.
            }
        };

        var handleRowSpanOnHide = function(rowIndex) {
            var group = $(rowCache[rowIndex]).attr(rowSpanGroupAttrib);

            if (!rowSpanCache[group]) { // Now rowspan in this group
                return;
            }

            // Decrement the group's rowspan
            var $rs = rowSpanCache[group].$rs;
            addToRowSpan($rs, -1);

            // Check if this row has the rowspan. If so, we need to move it to the next visible row.
            if (rowSpanCache[group].row === rowIndex) {
                // Find next visible row
                for (var j = rowIndex + 1, len = rowCache.length; j < len; ++j) {
                    var $node = $(rowCache[j]);

                    if ($node.attr(rowSpanGroupAttrib) !== group) {
                        break; // We've reached the end of this group
                    }

                    if (options.isHidden($node[0])) {
                        continue; // Ignore hidden nodes
                    }

                    // We've found a visible row. Move the rowspan inside it.
                    $rs.detach().prependTo($node);
                    // TODO: This will only work if the rowspan element is the first
                    // child inside the row.

                    rowSpanCache[group].row = j;

                    break;
                }
            }
        };

        var handleGroupRowsOnShow = function(rowIndex) {
            var $row = $(rowCache[rowIndex]);
            var group = $row.attr(colSpanGroupAttrib);

            ++colSpanCache[group].rows;

            if (colSpanCache[group].rows === 1 && colSpanCache[group].$cs) {
                colSpanCache[group].$cs.show();
            }
        };

        var handleGroupRowsOnHide = function(rowIndex) {
            var $row = $(rowCache[rowIndex]);
            var group = $row.attr(colSpanGroupAttrib);

            --colSpanCache[group].rows;

            if (colSpanCache[group].rows === 0 && colSpanCache[group].$cs) {
                colSpanCache[group].$cs.hide();
            }
        };

        /*
         * External API so that users can perform search programatically.
         * */
        this.search = function (submittedVal) {
            val = submittedVal;
            e.trigger();
        };

        /*
         * External API to get the number of matched results as seen in
         * https://github.com/ruiz107/quicksearch/commit/f78dc440b42d95ce9caed1d087174dd4359982d6
         * */
        this.currentMatchedResults = function() {
            return this.matchedResultsCount;
        };

        this.stripe = function () {
            if (typeof options.stripeRows === "object" && options.stripeRows !== null) {
                var joined = options.stripeRows.join(" ");
                var stripeRowsLength = options.stripeRows.length;

                rowCache.not(":hidden").each(function (i) {
                    $(this).removeClass(joined).addClass(options.stripeRows[i % stripeRowsLength]);
                });

                if (handleRowSpan) {
                    rowCache.find(options.rowSpanSelector).not(":hidden").each(function (i) {
                        $(this).removeClass(joined).addClass(options.stripeRows[i % stripeRowsLength]);
                    });
                }
            }

            return this;
        };

        var stripHtml = function (input) {
            var output = input.replace(new RegExp("<[^<]+\>", "g"), "");
            output = $.trim(output.toLowerCase());
            return output;
        };

        this.results = function (bool) {
            ifNonEmptyString(options.noResults, function() {
                if (bool) {
                    $(options.noResults).hide();
                } else {
                    $(options.noResults).show();
                }
            });
            return this;
        };

        this.loader = function (bool) {
            ifNonEmptyString(options.loader, function() {
                if (bool) {
                    $(options.loader).show();
                } else {
                    $(options.loader).hide();
                }
            });
            return this;
        };

        this.cache = function () {
            rowCache = $(target);

            ifNonEmptyString(options.noResults, function() {
                rowCache = rowCache.not(options.noResults);
            });

            textCache = [];
            rowSpanCache = {};
            colSpanCache = {};

            var rsText = "", rsGroup = -1, csGroup = -1;

            var findNodes =  function($row) {
                return ifNonEmptyString(options.selector, function() {
                    return $row.find(options.selector);
                }) || $row;
            };

            for (var i = 0, len = rowCache.length; i < len; ++i) {
                var $row = $(rowCache[i]);
                var text = "";

                if (handleRowSpan) { // Check if there is a rowspan
                    var $rs = $row.find(options.rowSpanSelector);
                    if ($rs.length !== 0) {
                        rsText = $rs[0].innerHTML;
                        ++rsGroup;

                        $row.attr(rowSpanGroupAttrib, rsGroup);

                        rowSpanCache[$row.attr(rowSpanGroupAttrib)] = { $rs: $rs, row: i };
                    } else if (rsGroup > -1) {
                        text = rsText;
                        $row.attr(rowSpanGroupAttrib, rsGroup);
                    }
                }

                if (handleGroupRows) {
                    var $cs = $row.find(options.groupRowSelector);
                    if ($cs.length !== 0) {
                        ++csGroup;
                        colSpanCache[csGroup] = { $cs: $cs, rows: 0 };
                    } else {
                        if (colSpanCache[csGroup] === undefined) {
                            colSpanCache[csGroup] = { $cs: null, rows: 0 };
                        } else {
                            colSpanCache[csGroup].rows += 1;
                        }
                    }

                    $row.attr(colSpanGroupAttrib, csGroup);
                }

                // Find nodes that shall be used for matching
                var t = findNodes($row);

                // Gather contents of all nodes (including the rowspan, possibly from a previous row)
                for (var j = 0, t_len = t.length; j < t_len; ++j) {
                    text += t[j].innerHTML;
                }

                textCache.push(stripHtml(text));
            }

            /*
             * Modified fix for sync-ing "val".
             * Original fix https://github.com/michaellwest/quicksearch/commit/4ace4008d079298a01f97f885ba8fa956a9703d1
             * */
            val = val || this.val() || "";

            return this.go();
        };

        this.trigger = function () {
            this.loader(true);
            options.onBefore();

            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                e.go();
            }, options.delay);

            return this;
        };

        this.cache();
        this.results(true);
        this.stripe();
        this.loader(false);

        return this.each(function () {
            /*
             * Changed from .bind to .on.
             * */
            $(this).on(options.bind, function () {
                val = $(this).val();
                e.trigger();
            });
        });
    };

}(jQuery, this, document));
