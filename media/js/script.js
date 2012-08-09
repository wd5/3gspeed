$(function() {
	$("#map_slider").slider({
		range: true,
		min: 0,
		max: 500,
		values: [ 75, 300 ]
	});

    $(".map_popup_op").live('click',function(){
        $('.map_popup_op').removeClass('curr')
        $(this).addClass("curr");
        var op_class = $(this).find('img').attr('alt');
        var curr_parent = $(this).parents('.tab')
        var cur_tab = $('div.'+op_class)
        var tr_set = $('.map_popup_info_table img[alt="'+op_class+'"]').parents('.map_popup_op').addClass("curr");
        $('.tab').addClass('tab_hidden')
        cur_tab.removeClass('tab_hidden')
    });

    $(".filter_toggle").live('click',function(){
        $(this).toggleClass("filter_toggle_show filter_toggle_hide");
        $('.map_filter').toggleClass("map_filter_hidden");
    });


});

$(function() {
	$(".select_curr").live('click',function(){
		$(this).parent().toggleClass("select_dropped");
	});
});

