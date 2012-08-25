$(function(){
        var operators = new Array();
        var abilities = new Array();
        var modem_types = new Array();
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
            var pointsSet = []

            $.getJSON('/get_points_json/', function(json){

                operators = json.operators;
                abilities = json.abilities;
                modem_types = json.modem_types;

                $.each(json.points, function(i, point){

                    var point_speed_values = {};
                    var point_speed_values_mdm = {};
                    // найдем среднюю скорость в точке по каждому оператору
                    var speed_values_set = point.operators;
                    var length = speed_values_set.length;
                    for (var i = 0; i <= length-1; i++)
                        {
                            var list = [];
                            if (point_speed_values[speed_values_set[i].op_id]) {
                                point_speed_values[speed_values_set[i].op_id].push(speed_values_set[i].speed);
                            } else { list.push(speed_values_set[i].speed);
                            point_speed_values[speed_values_set[i].op_id] = list;
                            }

                            var list2 = [];
                            if (point_speed_values_mdm[speed_values_set[i].modem_id]) {
                                point_speed_values_mdm[speed_values_set[i].modem_id].push(speed_values_set[i].speed);
                            } else { list2.push(speed_values_set[i].speed);
                            point_speed_values_mdm[speed_values_set[i].modem_id] = list2;
                            }
                        }
                    var max = 0;
                    var id_op_max;
                    for (item in point_speed_values) {
                        var point_speed_values_array = point_speed_values[item];
                        if (point_speed_values_array.length>1) { // - если больше чем 1 - усредняем
                            var sum = 0;
                            for(var k = 0; k < point_speed_values_array.length; k++) {
                                sum += point_speed_values_array[k];
                            }
                            var avg = sum/point_speed_values_array.length;
                            point_speed_values[item] = Math.round(avg*10)/10;
                        } else {
                            point_speed_values[item] = point_speed_values[item][0];
                        }
                        if (max<=point_speed_values[item]){
                            max = point_speed_values[item]; // максимум среди усредненных по операторам скоростей
                            id_op_max = item;
                        }
                    }
                    for (item in point_speed_values_mdm) {
                        var point_speed_values_array = point_speed_values_mdm[item];
                        if (point_speed_values_array.length>1) { // - если больше чем 1 - усредняем
                            var sum = 0;
                            for(var k = 0; k < point_speed_values_array.length; k++) {
                                sum += point_speed_values_array[k];
                            }
                            var avg = sum/point_speed_values_array.length;
                            point_speed_values_mdm[item] = Math.round(avg*10)/10;
                        } else {
                            point_speed_values_mdm[item] = point_speed_values_mdm[item][0];
                        }
                    }

                    var ability_icon_url = '/media/img/map_ic0.png';
                    // выставим нужный маркер для точки в зависимости от максимальной скорости по операторам в ней
                    for (var i = 0; i <= abilities.length-1; i++){
                        if (max>=abilities[i].speed){
                            ability_icon_url = abilities[i].marker;
                        }
                    }

                    coord = point.coord.split(',');
                    var placemark = new ymaps.Placemark(coord,
                        {
                            balloonContent: '',
                            point_id: point.id,
                            city_id: json.city_id,
                            speed_values: speed_values_set,
                            speed_values_by_op: point_speed_values,
                            speed_values_by_mdm: point_speed_values_mdm,
                            max_avg_spd_by_op: max
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
                            iconImageHref: ability_icon_url,
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
                        $.get('/load_balloon_content/', {id_point: id_point, op_title: curr_op}, function(data){
                            placemark.properties.set('balloonContent', data);
                            //var point_coord = placemark.geometry.getCoordinates();
                            //map.setCenter(point_coord);
                            });

                        /*$.ajax({
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
                            });*/
                    });
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
                var el = $(this);
                var parent = el.parents('div.select');
                var select_curr_div = parent.find('.select_curr');
                var select_curr_div_val = select_curr_div.html().replace("<div></div>","");
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
                select_curr_div.html(el.html()+'<div></div>');
                if (parent.is('.map_city_select'))
                    {select_curr_div.attr('name',el.attr('name'))}
                else
                    {}
                el.parent().remove();
                parent.toggleClass("select_dropped");


                var curr_city =  $('div.map_city_select div.select_curr').html().replace("<div></div>","")
                var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","")
                var curr_mtype = $('div.map_modem_select div.select_curr').html().replace("<div></div>","")

                if (parent.is('.map_city_select'))
                    {
                    var coords = select_curr_div.attr('name');
                    var city_param_array = coords.split('|');
                    coords_array = city_param_array[0].split(',');
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
                        var vals = $('#map_slider').slider( "option", "values" );
                        var minMBs = (vals[0]/250)-0.4;
                        var maxMBs = (vals[1]/250)-0.4;
                        LoadPMarker(curr_op,curr_mtype,minMBs,maxMBs);
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
                        var vals = $(this).slider( "option", "values" );
                        var icons_set = $('div.map_slider_ics span');
                        var length = icons_set.length;
                        for (var i = 0; i <= length-1; i++)
                            {
                                var elem = icons_set.eq(i);
                                var css_lft = elem.css('left').replace("px","");
                                css_lft = parseInt(css_lft);
                                if ((vals[1] > css_lft) && (vals[0] < css_lft)) {
                                    elem.addClass("map_slider_active");
                                } else {
                                    elem.removeClass("map_slider_active");
                                }
                            }
                    },
                    stop: function(event, ui) {
                        var vals = $(this).slider( "option", "values" );
                        var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","");
                        var curr_mtype =$('div.map_modem_select div.select_curr').html().replace("<div></div>","");
                        var minMBs = (vals[0]/250)-0.4;
                        var maxMBs = (vals[1]/250)-0.4;
                        LoadPMarker(curr_op,curr_mtype, minMBs, maxMBs);
                    }
                });

            function CheckAppropriateSpdVal(speed_value, min, max){
                var ok = false;
                if ((speed_value>=min) && (speed_value<=max)){
                    if ((max==3) && (speed_value>max)){
                        ok = true;
                    }
                    ok = true;
                }
                return ok;
            }

            function LoadPMarker(curr_op,curr_mtype,min,max)
                {
                    var NewPointsSet = [];
                    var curr_mdm_ids = [];
                    if ((curr_mtype!='Тип модема') && (curr_mtype!='Все')){
                        var curr_mtype_val = curr_mtype.replace(",",".");
                        curr_mtype_val = parseFloat(curr_mtype_val);
                        // вытащим idы модемов с такой downl_spd
                        for (var k = 0; k <= modem_types.length-1; k++){
                            if (modem_types[k].download_speed==curr_mtype_val){
                                curr_mdm_ids.push(modem_types[k].id);
                            }
                        }
                    }
                    var curr_op_id;
                    if ((curr_op!='Все') && (curr_op!='Оператор')){
                        // вытащим id оператора по тайтлу
                        for (var k = 0; k <= operators.length-1; k++){
                            if (operators[k].title==curr_op){
                                curr_op_id = operators[k].id;
                                break;
                            }
                        }
                    }

                    map.geoObjects.each(function (collection) { // удалим текущие элементы карты
                        map.geoObjects.remove(collection);
                    });
                    clusterer = new ymaps.Clusterer();
                    clusterer.add(pointsSet);
                    map.geoObjects.add(clusterer); // вставим на карту снова все точки

                    map.geoObjects.each(function (collection) {
                        arr = collection._geoObjects;
                        for (i in arr) {
                            var item = arr[i].geoObject;
                            var id_point = item.properties.get('point_id');
                            var metering_values = item.properties.get('speed_values');
                            var metering_values_by_op = item.properties.get('speed_values_by_op'); // avg
                            var metering_values_by_mdm = item.properties.get('speed_values_by_mdm');
                            var max_avg_spd_by_op = item.properties.get('max_avg_spd_by_op');
                            var marker_url = item.options.get('iconImageHref');
                            // вытащим из точки массив с ID операторов и ID типов модемов
                            var op_ids = [];
                            var modem_t_ids = [];
                            var speed_values = [];
                            for (var k = 0; k <= metering_values.length-1; k++){
                                if (op_ids.indexOf(metering_values[k].op_id)==-1){
                                    op_ids.push(metering_values[k].op_id);
                                }
                                if (modem_t_ids.indexOf(metering_values[k].modem_id)==-1){
                                    modem_t_ids.push(metering_values[k].modem_id);
                                }
                                if (metering_values_by_op[metering_values[k].op_id]){
                                    speed_values.push(metering_values_by_op[metering_values[k].op_id]);
                                }
                            }

                            if (((curr_op=='Все') || (curr_op=='Оператор')) && ((curr_mtype=='Тип модема') || (curr_mtype=='Все'))){ //- провенряем только по скорости
                                var speed_value = -1;
                                for (var k = 0; k <= speed_values.length-1; k++){ // выбираем максимальное по операторам
                                    if (speed_value<speed_values[k]){
                                        speed_value = speed_values[k];
                                    }
                                }
                                var ability_icon_url = '/media/img/map_ic0.png';
                                // выставим нужный маркер для точки в зависимости от скорости по операторау в ней
                                for (var k = 0; k <= abilities.length-1; k++){
                                    if (speed_value>=abilities[k].speed){
                                        ability_icon_url = abilities[k].marker;
                                    }
                                    item.options.set('iconImageHref', ability_icon_url);

                                }
                                if (speed_value!=-1){
                                    if (CheckAppropriateSpdVal(speed_value, min, max)){ // если значение скорости попало в интервал - вставляем точку в новый сет
                                        NewPointsSet.push(item);
                                    }
                                }
                            }

                            if ((((curr_op!='Все') && (curr_op!='Оператор')) && ((curr_mtype=='Тип модема') || (curr_mtype=='Все')))){ //- провенряем по оператору и по его скорости
                                var speed_value = -1;

                                if (metering_values_by_op[curr_op_id]!=undefined){ // если в данной точке есть измерения выбранного оператора - то ставим маркер для этого оператора и проверяем подходит ли скорость по оператору в интервал
                                    speed_value = metering_values_by_op[curr_op_id];
                                }
                                if (speed_value!=-1){
                                    var ability_icon_url = '/media/img/map_ic0.png';
                                    // выставим нужный маркер для точки в зависимости от скорости по операторау в ней
                                    for (var k = 0; k <= abilities.length-1; k++){
                                        if (speed_value>=abilities[k].speed){
                                            ability_icon_url = abilities[k].marker;
                                        }
                                        item.options.set('iconImageHref', ability_icon_url);

                                    }
                                    if (CheckAppropriateSpdVal(speed_value, min, max)){ // если значение скорости попало в интервал - вставляем точку в новый сет
                                        NewPointsSet.push(item);
                                    }
                                }
                            }

                            if ((((curr_op=='Все') || (curr_op=='Оператор')) && ((curr_mtype!='Тип модема') && (curr_mtype!='Все')))){
                                var mdm_t_ids = [];
                                for (var k = 0; k <= modem_t_ids.length-1; k++){
                                    if (curr_mdm_ids.indexOf(modem_t_ids[k])!=-1){
                                        mdm_t_ids.push(modem_t_ids[k]);
                                    }
                                }

                                //console.log(id_point, mdm_t_ids)
                                if (mdm_t_ids.length!=0){ // если есть точка с замерами на таком типе модема
                                    if (max_avg_spd_by_op!=-1){
                                        var ability_icon_url = '/media/img/map_ic0.png';
                                        for (var i = 0; i <= abilities.length-1; i++){
                                            if (max_avg_spd_by_op>=abilities[i].speed){
                                                ability_icon_url = abilities[i].marker;
                                            }
                                            item.options.set('iconImageHref', ability_icon_url);

                                        }
                                        if (CheckAppropriateSpdVal(max_avg_spd_by_op, min, max)){ // если значение скорости попало в интервал - вставляем точку в новый сет
                                            NewPointsSet.push(item);
                                        }
                                    }
                                }

                            }

                            if ((((curr_op!='Все') && (curr_op!='Оператор')) && ((curr_mtype!='Тип модема') && (curr_mtype!='Все')))){
                                var speed_value = -1;
                                var mdm_t_ids = [];
                                for (var k = 0; k <= modem_t_ids.length-1; k++){
                                    if (curr_mdm_ids.indexOf(modem_t_ids[k])!=-1){
                                        mdm_t_ids.push(modem_t_ids[k]);
                                    }
                                }
                                var ok = false;
                                for (var k = 0; k <= metering_values.length-1; k++){
                                    if ((mdm_t_ids.indexOf(metering_values[k].modem_id)!=-1) && (metering_values[k].op_id==curr_op_id)){
                                        ok = true;
                                    }
                                }

                                //console.log(id_point, mdm_t_ids)
                                if ((mdm_t_ids.length!=0) && ok){ // если есть точка с замерами на таком типе модема
                                    if (metering_values_by_op[curr_op_id]!=undefined){ // если в данной точке есть измерения выбранного оператора - то ставим маркер для этого оператора и проверяем подходит ли скорость по оператору в интервал
                                        speed_value = metering_values_by_op[curr_op_id];
                                    }

                                    if (speed_value!=-1){
                                        var ability_icon_url = '/media/img/map_ic0.png';
                                        // выставим нужный маркер для точки в зависимости от скорости по операторау в ней
                                        for (var k = 0; k <= abilities.length-1; k++){
                                            if (speed_value>=abilities[k].speed){
                                                ability_icon_url = abilities[k].marker;
                                            }
                                            item.options.set('iconImageHref', ability_icon_url);

                                        }
                                        if (CheckAppropriateSpdVal(speed_value, min, max)){ // если значение скорости попало в интервал - вставляем точку в новый сет
                                            NewPointsSet.push(item);
                                        }
                                    }
                                }

                            }
                        }
                        map.geoObjects.remove(collection); // удаляем все существующие на карте сеты
                    });
                    clusterer = new ymaps.Clusterer();
                    clusterer.add(NewPointsSet);
                    map.geoObjects.add(clusterer); // добавляем новый кластеризированный сет
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
