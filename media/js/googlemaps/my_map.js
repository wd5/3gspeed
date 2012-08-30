$(function(){

    var operators = new Array();
    var abilities = new Array();
    var modem_types = new Array();
    var infowindow;
    // если выбран текущий город, то ставин карту в его центр
    var curr_city_coord;
    if ($('#mapCenter').val()){
        coords = $('#mapCenter').val().split(',');
        curr_city_coord = new google.maps.LatLng(coords[0], coords[1]);
    } else { // в противном случае ставим центр в СПб*//*
        curr_city_coord = new google.maps.LatLng(59.934849, 30.330627);
    }

    var map_options = {
        zoom: 12,
        center: curr_city_coord,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var map = new google.maps.Map(document.getElementById("map"), map_options);
    // Создаем коллекцию, в которую будем добавлять метки
    var pointsSet = [];
    
    // точка текщих замеров
    if ($('#currMeasurePointId').val()!=''){
        coordCurr = $('#currMeasurePointCoord').val().split(',');
        var pointCurr = new google.maps.LatLng(coordCurr[0],coordCurr[1]);
        var image = new google.maps.MarkerImage('/media/img/car_point.png',
            //size
            new google.maps.Size(82, 82),
            //origin
            new google.maps.Point(0,0),
            // anchor
            new google.maps.Point(15, 40),
            // ScaledSize
            new google.maps.Size(82, 82));
        var CurrMeasurementPlacemark = new google.maps.Marker({
            position: pointCurr,
            point_id: $('#currMeasurePointId').val(),
            icon: image
        });

        // todo: клик по маркеру
        /*var CurrMeasurementPlacemark = new ymaps.Placemark(coordCurr,
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
        });*/
    }

    //  todo:  $("#map_slider").slider({

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

                var image = new google.maps.MarkerImage(ability_icon_url,
                    //size
                    new google.maps.Size(51, 56),
                    //origin
                    new google.maps.Point(0,0),
                    // anchor
                    new google.maps.Point(15, 40),
                    // ScaledSize
                    new google.maps.Size(37, 40));

                coord = point.coord.split(',');
                var point_coord = new google.maps.LatLng(coord[0],coord[1]);
                var placemark = new google.maps.Marker({
                        position: point_coord,
                        point_id: point.id,
                        city_id: json.city_id,
                        speed_values: speed_values_set,
                        speed_values_by_op: point_speed_values,
                        speed_values_by_mdm: point_speed_values_mdm,
                        max_avg_spd_by_op: max,

                        // options
                        icon: image

                    });

                google.maps.event.addListener(placemark, 'click', function() {
                    var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","");
                    var id_point = placemark.point_id;
                    if(infowindow)
                        {infowindow.close();}
                    $.get('/load_balloon_content/', {id_point: id_point, op_title: curr_op }, function(data){
                        var contentString = data;

                        var infobox_options = {
                            content: contentString
                            ,disableAutoPan: false
                            ,maxWidth: 0
                            ,pixelOffset: new google.maps.Size(-184, -315)
                            ,zIndex: 200
                            ,boxStyle: {
                               opacity: 1
                            }
                            //,closeBoxMargin: "-10px -10px 0px 0px"
                            //,closeBoxURL: "/media/img/close.png"
                            ,closeBoxURL: ""
                            ,infoBoxClearance: new google.maps.Size(1, 1)
                            ,isHidden: false
                            ,pane: "floatPane"
                            ,enableEventPropagation: false
                        };

                        var ib = new InfoBox(infobox_options);
                        infowindow = ib;

                        ib.open(map, placemark);

                        /*if ($('.map_popup').html()) {
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
                        }*/
                    });
                });

                /*var placemark = new ymaps.Placemark(coord,
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
                });*/

                pointsSet.push(placemark);
            });

            if ($('#currMeasurePointId').val()!=''){
                CurrMeasurementPlacemark.map = map;
            }

            var cluster_options = {
                maxZoom: 18,
                zoomOnClick: false
            };
            var markerCluster = new MarkerClusterer(map, pointsSet, cluster_options);
            $('.map_preload').hide();

            // todo: searchAddress();

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

    $('.map_popup_close').live('click', function(){
        if(infowindow)
            {infowindow.close();}
    });
    // закрытие инфобокса при клике на карту
    google.maps.event.addListener(map, 'click', function() {
        if(infowindow)
            {
                var popup_content = infowindow.getContent();
                console.log(popup_content.find('.map_popup'));
                //infowindow.close();
            }
    });
});
