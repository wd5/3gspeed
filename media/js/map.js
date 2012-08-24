    $(function(){
        ymaps.ready(function () {
            /*{% if city_curr %} // если выбран текущий город, то ставин карту в его центр
                var map = new ymaps.Map("map",
                    {
                        center: [$('#mapCenter').val().split(',')],
                        zoom: 14,
                        type: "yandex#map"
                    }
                );
                map.controls.add("zoomControl");
            {% else %} // в противном случае ставим центр в СПб
            */
                var map = new ymaps.Map("map",
                    {
                        center: [59.930879,30.329349],
                        zoom: 14,
                        type: "yandex#map"
                    }
                );
                map.controls.add("zoomControl");
            /*{% endif %}*/

            // Создаем коллекцию, в которую будем добавлять метки
            pointsSet = []

            $.getJSON('/get_points_json/', function(json){
                $.each(json.points, function(i, point){
                    // -



                    coord = point.coord.split(',');
                    var placemark = new ymaps.Placemark(coord,
                        {
                            balloonContent: '',
                            point_id: point.id,
                            city_id: json.city_id,
                            //operators_titles: point.operators
                        },
                        {
                            hideIconOnBalloonOpen: false,
                            openBalloonOnClick: false,
                            // Изображение иконки метки
                            /*
                            {% if op_curr %}
                                // если выбран какой-либо оператор - то ставим иконку для него
                                iconImageHref: '',
                                {% for operator in point.get_operators_without_params %}
                                    {% if operator.id == op_curr.id %}
                                        iconImageHref: '{% call "point.get_abilitiy_icon_additional" with op_curr.title %}',
                                    {% endif %}
                                {% endfor %}
                            {% else %}
                                iconImageHref: '{{ point.get_abilitiy_icon }}',
                            {% endif %}
                            */
                            iconImageHref: point.ability_icon,
                            iconImageSize: [37, 40],
                            balloonLayout: "default#imageWithContent",
                            balloonContentSize: [360, 0],
                            balloonImageOffset: [-188, -320],
                            balloonShadow: false
                        }
                    );
                placemark.events.add('click', function () {
                        var curr_city =  $('div.map_city_select div.select_curr').html().replace("<div></div>","")
                        var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","")
                        var curr_mtype =$('div.map_modem_select div.select_curr').html().replace("<div></div>","")

                        if(placemark.balloon.isOpen()) {
                            placemark.balloon.close();
                        }
                        else {
                            placemark.balloon.open();
                        }
                        var id_point = placemark.properties.get('point_id')
                        $.ajax({
                                url: "/load_balloon_content/",
                                data: {
                                    id_point:id_point,
                                    op_title:curr_op,
                                    mdm_type:curr_mtype
                                },
                                type: "POST",
                                success: function(data) {
                                    placemark.properties.set('balloonContent', data);
                                    var point_coord = placemark.geometry.getCoordinates();
                                    //map.setCenter(point_coord);
                                }
                            });
                    })
                    pointsSet.push(placemark);
                });

                clusterer = new ymaps.Clusterer();
                clusterer.add(pointsSet);
                map.geoObjects.add(clusterer);
                $('.map_preload').hide();
                searchAddress();
            });
                //поиск
            var searchAddress = function() {
                var search_text = $('.search_input').val();
                if (search_text.length > 0) {
                    var myGeocoder = ymaps.geocode(search_text);
                    myGeocoder.then(
                        function (res) {
                            map.geoObjects.add(res.geoObjects);
                            var first_point = res.geoObjects.get(0).geometry.getCoordinates();
                            map.panTo(first_point, {flying: true});
                        },
                        function (err) {}
                    );
                }
            }
            $('.search form').bind('submit', function(e){
                e.preventDefault();
                searchAddress();
                return false;
            });

            $('.map_popup_close').live('click', function(){
                map.balloon.close()
            });
            //не понял, зачем здесь это?
            map.events.add('click', function (item) {
                map.balloon.close()
            });

            $(".map_popup_op").live('click',function(){
                $('.map_popup_op').removeClass('curr')
                $(this).addClass("curr");
                var op_class = $(this).find('img').attr('alt');
                var curr_parent = $(this).parents('.tab')
                var tab_parent = $(this).parents('.map_popup_op')
                var cur_tab = $('div.'+op_class)
                var tr_set = $('.map_popup_info_table img[alt="'+op_class+'"]').parents('.map_popup_op')
                tr_set.addClass("curr");
                $('div.tab').addClass('tab_hidden');
                cur_tab.removeClass('tab_hidden');
            });


            $(".select_drop li a").live('click', function(){
                var el = $(this)
                var parent = el.parents('div.select')
                var select_curr_div = parent.find('.select_curr')
                var select_curr_div_val = select_curr_div.html().replace("<div></div>","")
                if ((select_curr_div_val != 'Оператор') && (select_curr_div_val != 'Тип модема'))
                    {
                        if (parent.is('.map_city_select'))
                            {el.parents('ul').prepend('<li><a href="#" name="'+select_curr_div.attr('name')+'">' + select_curr_div_val + '</a></li>');}
                        else
                            {el.parents('ul').prepend('<li><a href="#">' + select_curr_div_val + '</a></li>');}
                    }
                else
                    {if (select_curr_div_val == 'Тип модема')
                        {
                            el.parents('ul').prepend('<li><a href="#">Все</a></li>');
                        }
                    }
                select_curr_div.html(el.html()+'<div></div>')
                if (parent.is('.map_city_select'))
                    {select_curr_div.attr('name',el.attr('name'))}
                else
                    {}
                el.parent().remove()
                parent.toggleClass("select_dropped");


                var curr_city =  $('div.map_city_select div.select_curr').html().replace("<div></div>","")
                var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","")
                var curr_mtype =$('div.map_modem_select div.select_curr').html().replace("<div></div>","")

                if (parent.is('.map_city_select'))
                    {
                    var coords = select_curr_div.attr('name')
                    var city_param_array = coords.split('|')
                    coords_array = city_param_array[0].split(',')
                    map.panTo([parseFloat(coords_array[0]),parseFloat(coords_array[1])], {flying: true});
                    //вытащим плашку со средней скоростью
                    $.ajax({
                        url: "/load_stat_city_div/",
                        data: {
                            city_title:curr_city,
                            type:'avg'
                        },
                        type: "POST",
                        success: function(data) {
                            $('div.avg_speed').replaceWith(data)
                        }
                    });
                    //вытащим плашку с максимальной скоростью
                    $.ajax({
                        url: "/load_stat_city_div/",
                        data: {
                            city_title:curr_city,
                            type:'max'
                        },
                        type: "POST",
                        success: function(data) {
                            $('div.max_speed').replaceWith(data)
                        }
                    });
                    //вытащим плашку с количеством точек по городу
                    $.ajax({
                        url: "/load_stat_city_div/",
                        data: {
                            city_title:curr_city,
                            type:'count'
                        },
                        type: "POST",
                        success: function(data) {
                            $('div.pt_count').replaceWith(data)
                        }
                    });
                    }

                if ((parent.is('.map_op_select')) || (parent.is('.map_modem_select')))
                    {
                        var vals = $('#map_slider').slider( "option", "values" )
                        var minMBs = (vals[0]/250)-0.4
                        var maxMBs = (vals[1]/250)-0.4
                        LoadPMarker(curr_op,curr_mtype,minMBs,maxMBs)
                    }


                return false;
            });


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
                                if ((vals[1] > css_lft) && (vals[0] < css_lft)) {
                                    elem.addClass("map_slider_active")
                                } else {
                                    elem.removeClass("map_slider_active")
                                }
                            }
                    },
                    stop: function(event, ui) {
                        var vals = $(this).slider( "option", "values" )
                        var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","")
                        var curr_mtype =$('div.map_modem_select div.select_curr').html().replace("<div></div>","")
                        var minMBs = (vals[0]/250)-0.4
                        var maxMBs = (vals[1]/250)-0.4
                        LoadPMarker(curr_op,curr_mtype, minMBs, maxMBs)
                    }
                });

            function LoadPMarker(curr_op,curr_mtype,min,max)
                {
                    map.geoObjects.each(function (collection) {
                        arr = collection._geoObjects;
                        for (i in arr) {
                            var item = arr[i].geoObject;
                            var id_point = item.properties.get('point_id');
                            var op_list = item.properties.get('operators_titles');
                            collection.remove(item);
                            $.ajax({
                                url: "/load_point_marker/",
                                data: {
                                    id_point:id_point,
                                    op_title:curr_op,
                                    mdm_type:curr_mtype,
                                    min: min,
                                    max: max
                                },
                                type: "POST",
                                success: function(data) {
                                    data = eval('(' + data + ')');
                                    if ((op_list.indexOf(curr_op)!=-1) && (data.is_in_interval=='yes'))
                                        {
                                            item.options.set('iconImageHref', data.url);
                                            item.options.set('iconImageHrefId', data.id);
                                        }
                                    else
                                        {
                                            item.options.set('iconImageHref', '');
                                        }
                                    collection.add(item)
                                },
                                error:function(jqXHR,textStatus,errorThrown) {
                                    item.options.set('iconImageHref', '');
                                    collection.add(item);
                                }
                            });
                        }
                        
                        /*
                            
                            $.ajax({
                                url: "/load_point_marker/",
                                data: {
                                    id_point:id_point,
                                    op_title:curr_op,
                                    mdm_type:curr_mtype,
                                    min: min,
                                    max: max
                                },
                                type: "POST",
                                success: function(data) {
                                    data = eval('(' + data + ')');
                                    if ((op_list.indexOf(curr_op)!=-1) && (data.is_in_interval=='yes'))
                                        {
                                            item.options.set('iconImageHref', data.url);
                                            item.options.set('iconImageHrefId', data.id);
                                        }
                                    else
                                        {
                                            item.options.set('iconImageHref', '');
                                        }
                                    collection.add(item)
                                },
                                error:function(jqXHR,textStatus,errorThrown) {
                                    item.options.set('iconImageHref', '');
                                    collection.add(item)
                                }
                            });
                        });
                        */

                    });
                }


        });
    });

/*
            {% for city in cities %}
                {% for point in city.get_points %}
                    var point_{{ point.id }} = new ymaps.Placemark([{{ point.coord }}],
                        {
                            balloonContent: '',
                            point_id: '{{ point.id }}',
                            city_id: '{{ city.id }}',
                            operators_titles: ['Все',{% for operator in point.get_operators_without_params %}"{{ operator.title }}"{% if not forloop.last %},{% endif %}{% endfor %}]
                        },
                        {
                            // Не скрывать иконку метки при открытии балуна
                            hideIconOnBalloonOpen: false,
                            openBalloonOnClick: false,
                            // Изображение иконки метки
                            iconImageHref: '',
                            {% if op_curr %}
                                // если выбран какой-либо оператор - то ставим иконку для него
                                iconImageHref: '{% call "point.get_abilitiy_icon_additional" with op_curr.title %}',
                            {% else %}
                                iconImageHref: '{{ point.get_abilitiy_icon }}',
                            {% endif %}
                            // Задаем макет балуна - пользовательская картинка с контентом
                            balloonLayout: "default#imageWithContent",
                            // Размеры содержимого балуна
                            balloonContentSize: [360, 0],
                            // Смещение картинки балуна
                            balloonImageOffset: [-191, -305],
                            // Балун не имеет тени
                            balloonShadow: false
                        }
                    );
                    pointsSet.add(point_{{ point.id }});
                {% endfor %}
            {% endfor %}
*/
