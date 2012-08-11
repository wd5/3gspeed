$(document).ready(function() {
    //$('.fancybox').fancybox({helpers: {overlay : {opacity: 0.5}}});
    $('.fancybox').fancybox();

	$("#map_slider").slider({
		range: true,
		min: 100,
		max: 850,
		values: [ 100, 850 ],
        value: 1,
        step: 1,
        slide: function(event, ui) {
            var vals = $(this).slider( "option", "values" )
            var icons_set = $('div.map_slider_ics span')
            var length = icons_set.length
            for (var i = 0; i <= length-1; i++)
                {
                    var elem = icons_set.eq(i)
                    var css_lft = elem.css('left').replace("px","")
                    css_lft = parseInt(css_lft)
                    if ((vals[1]>css_lft) && (vals[0]<css_lft))
                        {elem.addClass("map_slider_active")}
                    else
                        {elem.removeClass("map_slider_active")}
                }
        },
        stop: function(event, ui) {
            var vals = $(this).slider( "option", "values" )

/*            $.ajax({
                url: "/load_tours/",
                data: {
                    type:$('.tours_menu li.curr a').attr('name'),
                    price_max:price_val,
                    max_star:val
                },
                type: "POST",
                success: function(data) {
                    $('.item_first').remove();
                    $('.items_catalog').replaceWith(data);
                },
                error:function(jqXHR,textStatus,errorThrown) {
                    $('.items_catalog').replaceWith(jqXHR.responseText);
                }
            });*/
        }

	});

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

