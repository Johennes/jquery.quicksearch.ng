# jQuery Quicksearch Plugin

This is a fork of the [jQuery][jquery_site] [quicksearch plugin][original_repo],
originally written by Rik Lomas. The plugin was extend to handle tables with
a row span on the first column. Since Rik does not seem to accept pull requests
anymore, I don't intend to merge these changes back into the original repository,
however.

## Usage

	$(input_selector).quicksearch(elements_to_search, options);

#### Example for Table Rows

	/* Example form */
	<form>
		<input type="text" id="search">
	</form>
	
	/* Example table */
	<table>
		<tbody>
			<tr>
				<td>Test cell</td>
				<td>Another test cell</td>
			</tr>
		</tbody>
	</table>
	
	<script type="text/javascript" src="jquery.js"></script>
	<script type="text/javascript" src="jquery.quicksearch.js"></script>
	<script type="text/javascript">
		$('input#search').quicksearch('table tbody tr');
	</script>

#### Example for `<th>` Elements in a Table Row

	$('input#search').quicksearch('table tbody tr', {
		selector: 'th'
	});

#### Example for Dynamic Elements

	var qs = $('input#id_search_list').quicksearch('ul#list_example li');
	$('ul#list_example').append('<li>Loaded with Ajax</li>');
	qs.cache();

#### Example of How to Use with AJAX

	var qs = $('input#search').quicksearch('table tbody tr');
	$.ajax({
		'type': 'GET',
		'url': 'index.html',
		'success': function (data) {
			$('table tbody tr').append(data);
			qs.cache();
		}
	});

## Options

* 	#### delay
	Delay of trigger in milliseconds
*	#### selector
	A query selector on sibling elements to test
*	#### rowSpanSelector
	A query selector to find the element with rowspan within a row
*	#### stripeRows
	An array of class names to go on each row
*	#### loader
	A query selector to find a loading element
*	#### noResults
	A query selector to show if there's no results for the search
*	#### bind
	Event that the trigger is tied to
*	#### onBefore
	Function to call before trigger is called
*	#### onAfter
	Function to call after trigger is called
*	#### show
	Function that will add styles to matched elements
*	#### hide
	Function that will add styles to unmatched elements
*	#### prepareQuery
	Function that transforms text from input_selector into query used by 'testQuery' function
*	#### testQuery
	Function that tells if a given item should be hidden
	It takes 3 arguments:
	- query prepared by 'prepareQuery'
	- stripped text from 'selector'
	- element to be potentially hidden

For example:

	$('input#search').quicksearch('table tbody tr', {
		'delay': 100,
		'selector': 'th',
		'stripeRows': ['odd', 'even'],
		'loader': 'span.loading',
		'noResults': 'tr#noresults',
		'bind': 'keyup keydown',
		'onBefore': function () {
			console.log('on before');
		},
		'onAfter': function () {
			console.log('on after');
		},
		'show': function () {
			$(this).addClass('show');
		},
		'hide': function () {
			$(this).removeClass('show');
		}
		'prepareQuery': function (val) {
			return new RegExp(val, "i");
		},
		'testQuery': function (query, txt, _row) {
			return query.test(txt);
		}
	});

## License

This plugin is released under the same licenses as the jQuery library itself: <http://docs.jquery.com/License>

[jquery_site]: http://www.jquery.com
[original_repo]: https://github.com/riklomas/quicksearch
