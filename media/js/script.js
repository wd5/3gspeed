$(document).ready(function() {
    //$('.fancybox').fancybox({helpers: {overlay : {opacity: 0.5}}});
    $('.fancybox').fancybox();

    $(".filter_toggle").live('click',function(){
        $(this).toggleClass("filter_toggle_show filter_toggle_hide");
        $('.map_filter').toggleClass("map_filter_hidden");
    });

    $('div.select').live('click',function(event){
        event.stopPropagation();
    });


}).click(function(){
   $('div.select').removeClass("select_dropped");
});

$(function() {
	$(".select_curr").live('click',function(){
		$(this).parent().toggleClass("select_dropped");
	});
});

