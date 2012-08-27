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



    $('.more_news_abt').live('click',function(){
        var el = $(this);
        var timeline = $(this).parents('.timeline');
        var load_block = timeline.find('.load_block');
        var already_loaded = timeline.find('#already_loaded').val();
        $.ajax({
            url: "/load_items_news_about/",
            data: {
                already_loaded: already_loaded
            },
            type: "POST",
            success: function(data) {
                load_block.append(data)
                load_block.find('.loaded:eq(0)').fadeIn("fast", function (){ //появление по очереди
                        $(this).next().fadeIn("fast", arguments.callee);
                    });
                //parent.find('.loaded').fadeIn('slow')  //простое появление
                load_block.find('div').removeClass('loaded')
                timeline.find('#already_loaded').val(load_block.find('#endrange').val())
                load_block.find('#endrange').remove()
                var rc = load_block.find('#remaining_count').val()
                if (rc<=0)
                    {timeline.find('.more_news_abt').remove()}
                load_block.find('#remaining_count').remove()

            }
        });

        return false;
    });


}).click(function(){
   $('div.select').removeClass("select_dropped");
});

$(function() {
	$(".select_curr").live('click',function(){
		$(this).parent().toggleClass("select_dropped");
	});
});
