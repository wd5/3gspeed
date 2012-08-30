$(function(){
        var operators = new Array();
        var abilities = new Array();
        var modem_types = new Array();
        ymaps.ready(function () {
            // если выбран текущий город, то ставин карту в его центр
            var curr_city_coord = [];
            if ($('#mapCenter').val()){
                curr_city_coord = $('#mapCenter').val().split(',');
            } else { // в противном случае ставим центр в СПб*//*
                curr_city_coord = [59.930879,30.329349];
            }

            var map = new ymaps.Map("map",
                {
                    center: curr_city_coord,
                    zoom: 14,
                    type: "yandex#map"
                }
            );
            map.controls.add("zoomControl");
            // Создаем коллекцию, в которую будем добавлять метки
            var pointsSet = []

            // точка текщих замеров
            if ($('#currMeasurePointId').val()!=''){
                coordCurr = $('#currMeasurePointCoord').val().split(',');
                var CurrMeasurementPlacemark = new ymaps.Placemark(coordCurr,
                    {
                        balloonContent: '',
                        point_id: $('#currMeasurePointId').val()
                    },
                    {
                        openBalloonOnClick: false,
                        iconImageHref: '/media/img/car_point.png',
                        iconImageSize: [82, 82],
                        iconImageOffset: [-36, -43],
                        hideIconOnBalloonOpen: false,
                        balloonLayout: "default#imageWithContent",
                        balloonContentSize: [360, 0],
                        balloonImageOffset: [-188, -320],
                        balloonShadow: false
                    }
                );
                CurrMeasurementPlacemark.events.add('click', function () {
                    var curr_city =  $('div.map_city_select div.select_curr').html().replace("<div></div>","")
                    var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","")
                    var curr_mtype =$('div.map_modem_select div.select_curr').html().replace("<div></div>","")

                    if(CurrMeasurementPlacemark.balloon.isOpen()) {
                        CurrMeasurementPlacemark.balloon.close();
                    }
                    else {
                        CurrMeasurementPlacemark.balloon.open();
                    }
                    var id_point = CurrMeasurementPlacemark.properties.get('point_id')
                    $.get('/load_balloon_content/', {id_point: id_point, op_title: curr_op }, function(data){
                        var pk = CurrMeasurementPlacemark.geometry.getCoordinates();
                        var bounds = map.getBounds();
                        var delta = (bounds[1][0] - bounds[0][0]) / 4; //0.0050000000;
                        pk[0] = parseFloat(pk[0]) + delta;
                        pk[1] = parseFloat(pk[1]);
                        map.panTo(pk, {
                            callback: function () {
                                CurrMeasurementPlacemark.properties.set('balloonContent', data);
                                if ($('.map_popup').html()) {
                                    var vals = $('#map_slider').slider( "option", "values" );
                                    var minMBs = (vals[0]/250)-0.4;
                                    var maxMBs = (vals[1]/250)-0.4;
                                    var map_popup_info_val_set = $('td.map_popup_info_val');
                                    for (var i = 0; i <= map_popup_info_val_set.length; i++) {
                                        var value = parseFloat(map_popup_info_val_set.eq(i).html());
                                        if ((value) || (value==0)) {
                                            if ((value<minMBs) || (value>maxMBs)) {
                                                map_popup_info_val_set.eq(i).css('color','#999');
                                            }
                                        }
                                    }
                                    var counter_val_set = $('div.counter_val');
                                    for (var i = 0; i <= counter_val_set.length; i++) {
                                        var value = parseFloat(counter_val_set.eq(i).html());
                                        if ((value) || (value==0)) {
                                            if ((value<minMBs) || (value>maxMBs)) {
                                                counter_val_set.eq(i).css('color','#666');
                                            }
                                        }
                                    }
                                }
                            },
                            flying: 1
                        });
                    });
                });
            }

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

            function getJSONPoints(id_city){
                var url = '/get_points_json/';
                if (id_city){
                    url += '?city_id=' + id_city;
                    $('.map_preload').show();
                }
                $.getJSON(url, function(json){
                    pointsSet = [];
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
                            $.get('/load_balloon_content/', {id_point: id_point, op_title: curr_op }, function(data){
                                var pk = placemark.geometry.getCoordinates();
                                var bounds = map.getBounds();
                                var delta = (bounds[1][0] - bounds[0][0]) / 4; //0.0050000000;
                                pk[0] = parseFloat(pk[0]) + delta;
                                pk[1] = parseFloat(pk[1]);
                                map.panTo(pk, {
                                    callback: function () {
                                        placemark.properties.set('balloonContent', data);
                                        if ($('.map_popup').html()) {
                                            var vals = $('#map_slider').slider( "option", "values" );
                                            var minMBs = (vals[0]/250)-0.4;
                                            var maxMBs = (vals[1]/250)-0.4;
                                            var map_popup_info_val_set = $('td.map_popup_info_val');
                                            for (var i = 0; i <= map_popup_info_val_set.length; i++) {
                                                var value = parseFloat(map_popup_info_val_set.eq(i).html());
                                                if ((value) || (value==0)) {
                                                    if ((value<minMBs) || (value>maxMBs)) {
                                                        map_popup_info_val_set.eq(i).css('color','#999');
                                                    }
                                                }
                                            }
                                            var counter_val_set = $('div.counter_val');
                                            for (var i = 0; i <= counter_val_set.length; i++) {
                                                var value = parseFloat(counter_val_set.eq(i).html());
                                                if ((value) || (value==0)) {
                                                    if ((value<minMBs) || (value>maxMBs)) {
                                                        counter_val_set.eq(i).css('color','#666');
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    flying: 1
                                });
                            });
                        });
                        pointsSet.push(placemark);
                    });

                    if ($('#currMeasurePointId').val()!=''){
                        map.geoObjects.add(CurrMeasurementPlacemark);
                    }
                    clusterer = new ymaps.Clusterer();
                    clusterer.add(pointsSet);
                    map.geoObjects.add(clusterer);
                    $('.map_preload').hide();
                    searchAddress();

                    if (($('#opTITLE').val())){
                        LoadPMarker($('#opTITLE').val(), 'Все', 0, 3);
                    }
                });
            }

            if ($('#cityID').val()){
                getJSONPoints($('#cityID').val());
            } else {
                getJSONPoints();
            }

            //поиск
            var searchAddress = function() {
                var search_text = $('.search_input').val();
                if (search_text.length > 0) {
                    var curr_city =  $('div.map_city_select div.select_curr').html().replace("<div></div>","");
                    var myGeocoder = ymaps.geocode(curr_city + ', ' + search_text);
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
                map.balloon.close();
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
                            {el.parents('ul').prepend('<li><a href="#" name="'+select_curr_div.attr('name')+'">' + select_curr_div_val + '</a></li>');}
                            //{el.parents('ul').prepend('<li><a href="#">' + select_curr_div_val + '</a></li>');}
                    }
                else
                    {if (select_curr_div_val == 'Тип модема')
                        {
                            el.parents('ul').prepend('<li><a href="#" name="0">Все</a></li>');
                        }
                    }
                select_curr_div.html(el.html()+'<div></div>');
                select_curr_div.attr('name',el.attr('name'));
                el.parent().remove();
                parent.toggleClass("select_dropped");


                if (!parent.is('.map_city_select')) {
                    var values = parent.find('a');
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
                }


                var curr_city =  $('div.map_city_select div.select_curr').html().replace("<div></div>","")
                var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","")
                var curr_mtype = $('div.map_modem_select div.select_curr').html().replace("<div></div>","")

                if (parent.is('.map_city_select'))
                    {
                    var coords = select_curr_div.attr('name');
                    var city_param_array = coords.split('|');
                    var curr_city_id = parseInt(city_param_array[1]);
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

                    // удалим старые точки и вытащим точки к городу
                    map.geoObjects.each(function (collection) { // удалим текущие элементы карты
                        map.geoObjects.remove(collection);
                    });
                    getJSONPoints(curr_city_id);
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
                    if(max >= 3) {
                        max = 40;
                    }
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

            $( ".map_fullscreen" ).click(function() {
                $('body').toggleClass("fullscreen");
                map.container.fitToViewport();
            });
        });
    });
