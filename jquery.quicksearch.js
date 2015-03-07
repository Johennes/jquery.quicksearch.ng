(function($, window, document, undefined) {
	
	$.fn.quicksearch = function (target, opt) {
		var timeout, textcache, rowcache, jq_results, val = "", e = this, options = $.extend({ 
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
			
			var isHidden = function($node) {
				return ($node[0].style.display === "none");
			};
			
			for (var i = 0, len = rowcache.length; i < len; i++) {
				if (val_empty || options.testQuery(query, textcache[i], rowcache[i])) {
					noresults = false;
					numMatchedRows++;
					
					if (!isHidden($(rowcache[i]))) {
						continue;
					}
					
					options.show.apply(rowcache[i]);
					
					e.doIfString(options.rowspanselector, function() {						
						// Check if any of the following elements has the rowspan
						$node = $(rowcache[i]);
						while (true) {
							$node = $node.next();
							
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
						$node = $(rowcache[i]);
						while (true) {
							$node = $node.prev();
							
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
					if (isHidden($(rowcache[i]))) {
						return;
					}
						
					options.hide.apply(rowcache[i]);
					
					e.doIfString(options.rowspanselector, function() {
						var rs = $(rowcache[i]).find(options.rowspanselector);
						if (rs.length !== 0) {
							rs.attr("rowspan", parseInt(rs.attr("rowspan")) - 1);
							
							// Find next visible element
							$node = $(rowcache[i]);
							while (true) {
								$node = $node.next();
								
								if ($node.length === 0
									|| $node.attr(options.rowspangroupattribute) !== $(rowcache[i]).attr(options.rowspangroupattribute)) {
									break;
								}
								
								if (isHidden($node)) {
									continue;
								}
								
								// Move element to node and decrement rowspan
								rs.detach().prependTo($node);
								break;
							}
						} else {
							// Find rowspan on previous row
							$node = $(rowcache[i]);
							while (true) {
								$node = $node.prev();
								
								if ($node.length === 0
									|| $node.attr(options.rowspangroupattribute) !== $(rowcache[i]).attr(options.rowspangroupattribute)) {
									break;
								}
								
								if (isHidden($node)) {
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
				
				jq_results.not(":hidden").each(function (i) {
					$(this).removeClass(joined).addClass(options.stripeRows[i % stripeRows_length]);
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
			jq_results = $(target);
			
			e.doIfString(options.noResults, function() {
				jq_results = jq_results.not(options.noResults);
			});
			
			var t = e.doIfString(options.selector, function() {
				return jq_results.find(options.selector);
			}) || jq_results;
			
			textcache = t.map(function () {
				return e.strip_html(this.innerHTML);
			});
			
			rowcache = jq_results.map(function () {
				return this;
			});

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
