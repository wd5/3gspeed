$(function() {
	$( "#map_slider" ).slider({
		range: true,
		min: 0,
		max: 500,
		values: [ 75, 300 ]
	});
});

$(function() {
	$( ".select_curr" ).click(function() {
		$(this).parent().toggleClass("select_dropped");
	});
});

$(function() {
	$( ".map_fullscreen" ).click(function() {
		$('body').toggleClass("fullscreen");
	});
});

