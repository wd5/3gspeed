$(function() {

    $('.load_items').live('click',function(){
        var el = $(this);
        var parent = $(this).parents('.load_block');
        $.ajax({
            url: "/load_items/",
            data: {
                cnt: el.find('.cnt').html(),
                init_cnt: parent.find('.init_cnt').val(),
                //init_cnt: parent.find('.l_item').length,
                m_name: parent.find('.m_name').val(),
                a_name: parent.find('.a_name').val(),
                template: parent.find('.template').val(),
                add_parameter: parent.find('.add_parameter').val()
            },
            type: "POST",
            success: function(data) {

                parent.append(data)
                parent.find('.loaded:eq(0)').fadeIn("fast", function (){ //появление по очереди
                        $(this).next().fadeIn("fast", arguments.callee);
                    });
                //parent.find('.loaded').fadeIn('slow')  //простое появление
                parent.find('div').removeClass('loaded')
                parent.find('.service_load_button').appendTo(parent)
                parent.find('.init_cnt').val(parent.find('#endrange').val())
                parent.find('#endrange').remove()
                var rctxt = parent.find('#remaining_count_text').val()
                var rc = parent.find('#remaining_count').val()
                if (rctxt!=undefined)
                    {el.html(rctxt)}
                if (rc<=0)
                    {parent.find('.service_load_button').remove()}
                parent.find('#remaining_count_text').remove()
                parent.find('#remaining_count').remove()

            }
        });

        return false;
    });

});