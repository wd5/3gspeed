$(function(){
    $(".select_drop li a").live('click', function(){
        var el = $(this)
        var parent = el.parents('div.select')
        var select_curr_div = parent.find('.select_curr')
        var select_curr_div_val = select_curr_div.html().replace("<div></div>","")
        if (select_curr_div_val != 'Улица')
            {
                el.parents('ul').prepend('<li><a href="#" name="'+select_curr_div.attr('name')+'">' + select_curr_div_val + '</a></li>');
            }
        else
            {
                el.parents('ul').prepend('<li><a href="#" name="0">Все улицы</a></li>');
            }

        select_curr_div.html(el.html()+'<div></div>');
        select_curr_div.attr('name',el.attr('name'));
        el.parent().remove()
        parent.toggleClass("select_dropped");

        var values = parent.find('a');
        console.log(values);
        for (var j=0; j<=values.length-2; j++) {
            for (var i=0; i<=values.length-1-j; i++) {
                var bufATTR;
                var bufHTML;
                var val1 = parseInt(values.eq(i).attr('name'));
                var val2 = parseInt(values.eq(i+1).attr('name'));
                if (val1>val2) {
                    bufATTR = values.eq(i).attr('name');
                    bufHTML = values.eq(i).html();
                    values.eq(i).attr('name',val2);
                    values.eq(i).html(values.eq(i+1).html());
                    values.eq(i+1).attr('name',bufATTR);
                    values.eq(i+1).html(bufHTML);
                }
            }
        }




        var id_city = $('div.stat_city .select_curr').attr('name');
        var id_distinct = $('div.stat_distinct .select_curr').attr('name');
        if (parent.is('.stat_city'))
            {
            // подгружаем районы города
                $.ajax({
                    url: "/load_city_distincts/",
                    data: {
                        id_city:id_city
                    },
                    type: "POST",
                    success: function(data) {
                        $('div.stat_distinct').html('<div class="select_curr" name="0">Район<div></div></div><div class="select_drop"><ul>'+ data +'</ul></div>')
                    },
                    error:function(jqXHR,textStatus,errorThrown) {
                        $('div.stat_distinct').html('<div class="select_curr" name="0">Район<div></div></div><div class="select_drop"><ul></ul></div>')
                    }
                });

            // подгружаем среднюю скорость
                $.ajax({
                    url: "/load_city_avg_speed/",
                    data: {
                        id_city:id_city
                    },
                    type: "POST",
                    success: function(data) {
                        $('div.average').replaceWith(data)
                    },
                    error:function(jqXHR,textStatus,errorThrown) {
                        $('div.average').replaceWith('<div class="average"><div class="average_arr"></div></div>')
                    }
                });

            // подгружаем статистику по городу
                $.ajax({
                    url: "/load_city_stat/",
                    data: {
                        id_city:id_city
                    },
                    type: "POST",
                    beforeSend: function(){
                        $('div.stats_block').html("<div class='measurements_qty'><img style='position:relative;left: 50%;top: 50%;margin-top: -8px;margin-left: -110px;' src='/media/img/ajax-loader.gif' alt='' /></div>");
                    },
                    success: function(data) {
                        $('div.stats_block').replaceWith(data)
                    },
                    error:function(jqXHR,textStatus,errorThrown) {
                        $('div.stats_block').replaceWith('<div class="stats_block"><div class="h_line"><h2>Нет статистики по данному городу</h2></div></div>')
                    }
                });
            }
        if (parent.is('.stat_distinct'))
            {
            // подгружаем среднюю скорость
                $.ajax({
                    url: "/load_city_avg_speed/",
                    data: {
                        id_city:id_city,
                        id_distinct:id_distinct
                    },
                    type: "POST",
                    success: function(data) {
                        $('div.average').replaceWith(data)
                    },
                    error:function(jqXHR,textStatus,errorThrown) {
                        $('div.average').replaceWith('<div class="average"><div class="average_arr"></div></div>')
                    }
                });


            // подгружаем статистику по району
                $.ajax({
                    url: "/load_city_stat/",
                    data: {
                        id_city:id_city,
                        id_distinct:id_distinct
                    },
                    type: "POST",
                    beforeSend: function(){
                        $('div.stats_block').html("<div class='measurements_qty'><img style='position:relative;left: 50%;top: 50%;margin-top: -8px;margin-left: -110px;' src='/media/img/ajax-loader.gif' alt='' /></div>");
                    },
                    success: function(data) {
                        $('div.stats_block').replaceWith(data)
                    },
                    error:function(jqXHR,textStatus,errorThrown) {
                        $('div.stats_block').replaceWith('<div class="stats_block"><div class="h_line"><h2>Нет статистики по данному городу</h2></div></div>')
                    }
                });
            }
        return false;
    });
});