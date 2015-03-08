(function($, window, document, undefined) {
	
	$.fn.quicksearch = function (target, opt) {
		var timeout, textcache, rowcache, val = "", e = this, options = $.extend({ 
			delay: 100,
			selector: null,
			rowspanselector: null,
			rowspangroupattribute: null,
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
		}, opt);
		
		var addToRowSpan = function($node, amount) {
			$node.attr("rowspan", parseInt($node.attr("rowspan")) + amount);
		};
		
		this.go = function () {
			var i = 0,
				numMatchedRows = 0,
				noresults = true, 
				query = options.prepareQuery(val),
				val_empty = (val.replace(" ", "").length === 0);
			
			for (var i = 0, len = rowcache.length; i < len; i++) {
				if (val_empty || options.testQuery(query, textcache[i], rowcache[i])) {
					noresults = false;
					numMatchedRows++;
					
					if (!options.isHidden(rowcache[i])) { // Only show rows that are not visible
						continue;
					}
					
					options.show.apply(rowcache[i]);
					
					e.doIfString(options.rowspanselector, function() {
						// Check if this row has the rowspan. If so, we can just increment it and are done.
						var $rs = $(rowcache[i]).find(options.rowspanselector);
						if ($rs.length !== 0) {
							addToRowSpan($rs, 1);
							return;
						}
						
						var group = $(rowcache[i]).attr(options.rowspangroupattribute);
						
						// Check if any of the following rows has the rowspan. Note that the rowspan might be
						// on a hidden row if all rows of this group were hidden.
						for (var j = i + 1; j < len; ++j) {
							$node = $(rowcache[j]);
							
							if ($node.attr(options.rowspangroupattribute) !== group) {
								break; // We've reached the end of this group
							}
							
							$rs = $node.find(options.rowspanselector);
							if ($rs.length !== 0) {
								// We've found the rowspan. Increment it and move it to the shown row.
								addToRowSpan($rs, 1);
								$rs.detach().prependTo($(rowcache[i]));
								// TODO: This will only work if the rowspan element is the first
								// child inside the row.
								return;
							}
						}
						
						// Check if any of the preceding rows has the rowspan. Note that the rowspan might be
						// on a hidden row if all rows of this group were hidden.
						for (var j = i - 1; j >= 0; --j) {
							$node = $(rowcache[j]);
							
							if ($node.attr(options.rowspangroupattribute) !== group) {
								break; // We've reached the end of this group
							}
							
							$rs = $node.find(options.rowspanselector);
							if ($rs.length !== 0) {
								// We've found the rowspan. Increment it. No need to move it since it already
								// is on a preceding row.
								addToRowSpan($rs, 1);
								return;
							}
						}
					});
				} else {
					if (options.isHidden(rowcache[i])) { // Only hide rows that are visible
						continue;
					}
						
					options.hide.apply(rowcache[i]);
					
					e.doIfString(options.rowspanselector, function() {
						var group = $(rowcache[i]).attr(options.rowspangroupattribute);
						
						// Check if this row has the rowspan. If so, we need to move it to the next visible row.
						var $rs = $(rowcache[i]).find(options.rowspanselector);
						if ($rs.length !== 0) {
							addToRowSpan($rs, -1);
							
							// Find next visible row
							for (var j = i + 1; j < len; ++j) {
								$node = $(rowcache[j]);
								
								if ($node.attr(options.rowspangroupattribute) !== group) {
									break; // We've reached the end of this group
								}
								
								if (options.isHidden($node[0])) {
									continue; // Ignore hidden nodes
								}
								
								// We've found a visible row. Move the rowspan inside it.
								$rs.detach().prependTo($node);
								// TODO: This will only work if the rowspan element is the first
								// child inside the row.
								break;
							}
						} else {
							// Check if any of the preceding rows has the rowspan
							for (var j = i - 1; j > 0; --j) {
								$node = $(rowcache[j]);
								
								if ($node.attr(options.rowspangroupattribute) !== group) {
									break; // We've reached the end of this group
								}
								
								if (options.isHidden($node[0])) {
									continue; // Ignore hidden nodes
								}
								
								$rs = $node.find(options.rowspanselector);
								if ($rs.length !== 0) {
									// We've found the rowspan. Decrement it.
									addToRowSpan($rs, -1);
									break;
								}
							}
							
							// We don't need to search for the rowspan on any of the
							// following rows since it will always be on the first
							// visible row inside a group and this row was visible.
						}
					});
				}
			}
			
			if (noresults) {
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
				var stripeRows_length = options.stripeRows.length;
				
				rowcache.not(":hidden").each(function (i) {
					$(this).removeClass(joined).addClass(options.stripeRows[i % stripeRows_length]);
				});
				
				e.doIfString(options.rowspanselector, function() {
					rowcache.find(options.rowspanselector).not(":hidden").each(function (i) {
						$(this).removeClass(joined).addClass(options.stripeRows[i % stripeRows_length]);
					});
				});
			}
			
			return this;
		};
		
		this.strip_html = function (input) {
			var output = input.replace(new RegExp("<[^<]+\>", "g"), "");
			output = $.trim(output.toLowerCase());
			return output;
		};
		
		this.doIfString = function(arg, callback) {
			if (typeof arg === "string" && arg !== "") {
				return callback();
			}
		};
		
		this.results = function (bool) {
			e.doIfString(options.noResults, function() {
				if (bool) {
					$(options.noResults).hide();
				} else {
					$(options.noResults).show();
				}
			});
			return this;
		};
		
		this.loader = function (bool) {
			e.doIfString(options.loader, function() {
				if (bool) {
					$(options.loader).show();
				} else {
					$(options.loader).hide();
				}
			});
			return this;
		};
		
		this.cache = function () {
			rowcache = $(target);
			
			e.doIfString(options.noResults, function() {
				rowcache = rowcache.not(options.noResults);
			});
			
			textcache = [];
			var rs_text = ""
			
			for (var i = 0, len = rowcache.length; i < len; ++i) {
				// Check if there is a rowspan. If so, remember its contents.
				e.doIfString(options.rowspanselector, function() {
					var $rs = $(rowcache[i]).find(options.rowspanselector);
					if ($rs.length !== 0) {
						rs_text = $rs[0].innerHTML;
					}
				});
				
				// Find nodes that shall be used for matching
				var t = e.doIfString(options.selector, function() {
					return $(rowcache[i]).find(options.selector);
				}) || $(rowcache[i]);
				
				// Gather contents of all nodes (including the rowspan, possibly from a previous row)
				var text = rs_text;
				for (var j = 0, t_len = t.length; j < t_len; ++j) {
					text += t[j].innerHTML;
				}
				
				textcache.push(e.strip_html(text));
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
