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
						// Check if this element has the rowspan
						var rs = $(rowcache[i]).find(options.rowspanselector);
						if (rs.length !== 0) {
							rs.attr("rowspan", parseInt(rs.attr("rowspan")) - 1);
							return;
						}
						
						// Check for rowspan on any of the following rows
						for (var j = i + 1; j < len; ++j) {
							$node = $(rowcache[j]);
							
							if ($node.length === 0
								|| $node.attr(options.rowspangroupattribute) !== $(rowcache[i]).attr(options.rowspangroupattribute)) {
								break;
							}
							
							// The row span might be on a hidden row if all rows for this group were hidden
							/*if (isHidden($node)) {
								continue;
							}*/
							
							rs = $node.find(options.rowspanselector);
							if (rs.length !== 0) { // Move and increment rowspan
								rs.detach().prependTo($(rowcache[i]));
								rs.attr("rowspan", parseInt(rs.attr("rowspan")) + 1);
								return;
							}
						}
						
						// Find rowspan on preceding row
						for (var j = i - 1; j >= 0; --j) {
							$node = $(rowcache[j]);
							
							if ($node.length === 0
								|| $node.attr(options.rowspangroupattribute) !== $(rowcache[i]).attr(options.rowspangroupattribute)) {
								break;
							}
							
							// The row span might be on a hidden row if all rows for this group were hidden
							/*if (isHidden($node)) {
								continue;
							}*/
							
							rs = $node.find(options.rowspanselector);
							if (rs.length !== 0) { // Move and increment rowspan
								rs.attr("rowspan", parseInt(rs.attr("rowspan")) + 1);
								return;
							}
						}
					});
				} else {
					if (options.isHidden(rowcache[i])) {
						continue;
					}
						
					options.hide.apply(rowcache[i]);
					
					e.doIfString(options.rowspanselector, function() {
						var rs = $(rowcache[i]).find(options.rowspanselector);
						if (rs.length !== 0) {
							rs.attr("rowspan", parseInt(rs.attr("rowspan")) - 1);
							
							// Find next visible element
							for (var j = i + 1; j < len; ++j) {
								$node = $(rowcache[j]);
								
								if ($node.length === 0
									|| $node.attr(options.rowspangroupattribute) !== $(rowcache[i]).attr(options.rowspangroupattribute)) {
									break;
								}
								
								if (options.isHidden($node[0])) {
									continue;
								}
								
								// Move element to node and decrement rowspan
								rs.detach().prependTo($node);
								break;
							}
						} else {
							// Find rowspan on previous row
							for (var j = i - 1; j > 0; --j) {
								$node = $(rowcache[j]);
								
								if ($node.length === 0
									|| $node.attr(options.rowspangroupattribute) !== $(rowcache[i]).attr(options.rowspangroupattribute)) {
									break;
								}
								
								if (options.isHidden($node[0])) {
									continue;
								}
								
								rs = $node.find(options.rowspanselector);
								if (rs.length !== 0) { // Decrement rowspan								
									rs.attr("rowspan", parseInt(rs.attr("rowspan")) - 1);
									break;
								}
							}
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
			
			var t = e.doIfString(options.selector, function() {
				return rowcache.find(options.selector);
			}) || rowcache;
			
			textcache = [];
			var rs_text = ""
			for (var i = 0, len = t.length; i < len; ++i) {
				var text = t[i].innerHTML;
				
				e.doIfString(options.rowspanselector, function() {
					var rs = $(t[i]).find(options.rowspanselector);
					if (rs.length !== 0) {
						rs_text = rs[0].innerHTML;
					}
					text = rs_text + text;
				});
				
				textcache.push(e.strip_html(text));
			}
			
			// TODO: Make sure that rowcache and textcache have the same number 

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
