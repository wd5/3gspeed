var infowindow;

$(function(){

    var operators = new Array();
    var abilities = new Array();
    var modem_types = new Array();
    var searchMarker;
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
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        overviewMapControl: false
    };

    var map = new google.maps.Map(document.getElementById("map"), map_options);
    // Создаем коллекцию, в которую будем добавлять метки
    var pointsSet = [];
    var markerCluster;
 
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
            new google.maps.Point(40, 40),
            // ScaledSize
            new google.maps.Size(82, 82));
        var CurrMeasurementPlacemark = new google.maps.Marker({
            position: pointCurr,
            point_id: $('#currMeasurePointId').val(),
            icon: image,
            map: map
        });

        map.panTo(CurrMeasurementPlacemark.position);

        google.maps.event.addListener(CurrMeasurementPlacemark, 'click', function() {
            var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","");
            var id_point = CurrMeasurementPlacemark.point_id;
            if(infowindow)
                {infowindow.close();}
            $.get('/load_balloon_content/', {id_point: id_point, op_title: curr_op }, function(data){
                var boxText = document.createElement("div");
                var contentString = data;
                boxText.innerHTML = contentString;

                var infobox_options = {
                    content: boxText,
                    alignBottom: true,
                    disableAutoPan: true,
                    maxWidth: 0,
                    pixelOffset: new google.maps.Size(-184, -50),
                    zIndex: 200,
                    boxStyle: {
                       opacity: 1
                    },
                    closeBoxMargin: "-13px -11px 0px 0px",
                    //closeBoxURL: "/media/img/close.png",
                    closeBoxURL: "",
                    infoBoxClearance: new google.maps.Size(1, 50),
                    isHidden: false,
                    pane: "floatPane",
                    enableEventPropagation: false
                };

                var ib = new InfoBox(infobox_options);
                infowindow = ib;

                var bounds = map.getBounds();
                var ne = bounds.getNorthEast();
                var sw = bounds.getSouthWest();
                delta = (ne.lat() - sw.lat()) / 5;
                pos = CurrMeasurementPlacemark.getPosition();
                var latlng = new google.maps.LatLng(pos.lat() + delta, pos.lng());
                map.panTo(latlng);


                ib.open(map, CurrMeasurementPlacemark);

                google.maps.event.addListener(ib, 'domready', function() {
                    $(".map_popup_op").click(function(){
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
                    $('.map_popup_close').click(function(){
                        if(infowindow)
                            {infowindow.close();}
                    });
                    if ($('.map_popup').html()) {
                        var vals = $('#map_slider').slider( "option", "values" );
                        var minMBs = (vals[0]/250)-0.4;
                        var maxMBs = (vals[1]/250)-0.4;
                        if(maxMBs >= 3) {
                            maxMBs = 40;
                        }
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
                });
            });

        });
    }

            $(".select_drop li a").live('click', function(){
                var el = $(this);
                var parent = el.parents('div.select');
                var select_curr_div = parent.find('.select_curr');
                var select_curr_div_val = select_curr_div.html().replace("<div></div>","");
                if ((select_curr_div_val != 'Оператор') && (select_curr_div_val != 'Тип модема'))
                    {
                    /*    if (parent.is('.map_city_select'))
                            {el.parents('ul').prepend('<li><a href="#" name="'+select_curr_div.attr('name')+'">' + select_curr_div_val + '</a></li>');}
                        else
                            {el.parents('ul').prepend('<li><a href="#" name="'+select_curr_div.attr('name')+'">' + select_curr_div_val + '</a></li>');}
                            //{el.parents('ul').prepend('<li><a href="#">' + select_curr_div_val + '</a></li>');}*/
                    }
                else
                    {if (select_curr_div_val == 'Тип модема')
                        {
                            el.parents('ul').prepend('<li><a href="#" name="0">Все</a></li>');
                        }
                    }

                select_curr_div.html(el.html()+'<div></div>');
                select_curr_div.attr('name',el.attr('name'));
                //el.parent().remove();
                parent.toggleClass("select_dropped");

                var curr_city =  $('div.map_city_select div.select_curr').html().replace("<div></div>","");
                var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","");
                var curr_mtype = $('div.map_modem_select div.select_curr').html().replace("<div></div>","");

                if (select_curr_div_val!=el.html()) { // если это не повторное нажатие - тогда работаем

                    if (parent.is('.map_city_select'))
                        {
                        var coords = select_curr_div.attr('name');
                        var city_param_array = coords.split('|');
                        var curr_city_id = parseInt(city_param_array[1]);
                        coords_array = city_param_array[0].split(',');
                        city_coord = new google.maps.LatLng(coords_array[0], coords_array[1]);
                        map.setCenter(city_coord);
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
                        //вытащим типы модемов для выбранного города
                        $.ajax({
                            url: "/load_stat_city_div/",
                            data: {
                                city_title:curr_city,
                                type:'mtypes'
                            },
                            type: "POST",
                            success: function(data) {
                                $('div.map_modem_select').replaceWith(data)
                            }
                        });

                        // удалим старые точки и вытащим точки к городу
                        getJSONPoints(curr_city_id);
                        }

                    if ((parent.is('.map_op_select')) || (parent.is('.map_modem_select')))
                        {
                            var vals = $('#map_slider').slider( "option", "values" );
                            var minMBs = (vals[0]/250)-0.4;
                            var maxMBs = (vals[1]/250)-0.4;
                            LoadPMarker(curr_op,curr_mtype,minMBs,maxMBs);
                        }
                }

                return false;
            });

    function getJSONPoints(id_city){
        if (markerCluster){
            markerCluster.clearMarkers();
            pointsSet = [];
        }
        var url = '/get_points_json/';
        if (id_city){
            url += '?city_id=' + id_city;
            $('.map_preload').show();
        }
        $.getJSON(url, function(json){
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

                var image = GetIconImg(ability_icon_url);

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
                        var boxText = document.createElement("div");
                        var contentString = data;
                        boxText.innerHTML = contentString;

                        var infobox_options = {
                            content: boxText,
                            alignBottom: true,
                            disableAutoPan: true,
                            maxWidth: 0,
                            pixelOffset: new google.maps.Size(-184, -50),
                            zIndex: 200,
                            boxStyle: {
                               opacity: 1
                            },
                            closeBoxMargin: "-13px -11px 0px 0px",
                            //closeBoxURL: "/media/img/close.png",
                            closeBoxURL: "",
                            infoBoxClearance: new google.maps.Size(1, 50),
                            isHidden: false,
                            pane: "floatPane",
                            enableEventPropagation: false
                        };

                        var ib = new InfoBox(infobox_options);
                        infowindow = ib;

        var bounds = map.getBounds();
        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();
        delta = (ne.lat() - sw.lat()) / 5;
        pos = placemark.getPosition();
        var latlng = new google.maps.LatLng(pos.lat() + delta, pos.lng());
        map.panTo(latlng);


                        ib.open(map, placemark);

                        google.maps.event.addListener(ib, 'domready', function() {
                            $(".map_popup_op").click(function(){
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
                            $('.map_popup_close').click(function(){
                                if(infowindow)
                                    {infowindow.close();}
                            });
                            if ($('.map_popup').html()) {
                                var vals = $('#map_slider').slider( "option", "values" );
                                var minMBs = (vals[0]/250)-0.4;
                                var maxMBs = (vals[1]/250)-0.4;
                                if(maxMBs >= 3) {
                                    maxMBs = 40;
                                }
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
                        });
                    });

                });

                pointsSet.push(placemark);
                if ($('#IdMaxPoint').val()){
                    if ($('#IdMaxPoint').val()==point.id)
                        {map.panTo(placemark.position);
                        map.setZoom(19);

                            var curr_op = $('div.map_op_select div.select_curr').html().replace("<div></div>","");
                            var id_point = placemark.point_id;
                            if(infowindow)
                                {infowindow.close();}
                            $.get('/load_balloon_content/', {id_point: id_point, op_title: curr_op }, function(data){
                                var boxText = document.createElement("div");
                                var contentString = data;
                                boxText.innerHTML = contentString;

                                var infobox_options = {
                                    content: boxText,
                                    alignBottom: true,
                                    disableAutoPan: true,
                                    maxWidth: 0,
                                    pixelOffset: new google.maps.Size(-184, -50),
                                    zIndex: 200,
                                    boxStyle: {
                                       opacity: 1
                                    },
                                    closeBoxMargin: "-13px -11px 0px 0px",
                                    //closeBoxURL: "/media/img/close.png",
                                    closeBoxURL: "",
                                    infoBoxClearance: new google.maps.Size(1, 50),
                                    isHidden: false,
                                    pane: "floatPane",
                                    enableEventPropagation: false
                                };

                                var ib = new InfoBox(infobox_options);
                                infowindow = ib;

                var bounds = map.getBounds();
                var ne = bounds.getNorthEast();
                var sw = bounds.getSouthWest();
                delta = (ne.lat() - sw.lat()) / 5;
                pos = placemark.getPosition();
                var latlng = new google.maps.LatLng(pos.lat() + delta, pos.lng());
                map.panTo(latlng);


                                ib.open(map, placemark);

                                google.maps.event.addListener(ib, 'domready', function() {
                                    $(".map_popup_op").click(function(){
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
                                    $('.map_popup_close').click(function(){
                                        if(infowindow)
                                            {infowindow.close();}
                                    });
                                    if ($('.map_popup').html()) {
                                        var vals = $('#map_slider').slider( "option", "values" );
                                        var minMBs = (vals[0]/250)-0.4;
                                        var maxMBs = (vals[1]/250)-0.4;
                                        if(maxMBs >= 3) {
                                            maxMBs = 40;
                                        }
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
                                });
                            });
                        }
                }
            });

            var cluster_options = {
                maxZoom: 18,
                zoomOnClick: false,
                styles: [{
                    url: '/media/img/cluster.png',
                    height: 58,
                    width: 58,
                    //anchor: [4, 0],
                    text: 'Times New Roman',
                    textColor: '#000',
                    textSize: 15
                }]
            };
            markerCluster = new MarkerClusterer(map, pointsSet, cluster_options);
            $('.map_preload').hide();
            searchAddress();

            if (($('#opTITLE').val())){
                LoadPMarker($('#opTITLE').val(), 'Все', 0, 3);
            }
        });
    }

            //поиск
            var searchAddress = function() {
                var search_text = $('.search_input').val();
                if (search_text.length > 0) {
                    var curr_city =  $('div.map_city_select div.select_curr').html().replace("<div></div>","");
                    search_text = curr_city + ', ' + search_text;
                    geocoder = new google.maps.Geocoder();
                    geocoder.geocode( { 'address': search_text}, function(results, status) {
                      console.log(curr_city, results[0].address_components[2].long_name);
                      if ((status == google.maps.GeocoderStatus.OK) && (curr_city==results[0].address_components[2].long_name)) {
                        /*if (searchMarker) {
                            searchMarker.setMap(null);
                        }*/
                        map.setCenter(results[0].geometry.location);
                        map.setZoom(15);
                          $('.search_input').val(results[0].formatted_address);
                        /*searchMarker = new google.maps.Marker({
                            map: map,
                            position: results[0].geometry.location
                        });*/
                      }
                    });
                }
            }
            $('.search form').bind('submit', function(e){
                e.preventDefault();
                searchAddress();
                return false;
            });

    if ($('#cityID').val()){
        getJSONPoints($('#cityID').val());
    } else {
        getJSONPoints();
    }

            function GetIconImg(ability_icon_url){
                var image = new google.maps.MarkerImage(ability_icon_url,
                    //size
                    new google.maps.Size(51, 56),
                    //origin
                    new google.maps.Point(0,0),
                    // anchor
                    new google.maps.Point(15, 40),
                    // ScaledSize
                    new google.maps.Size(37, 40));
                return image
            }

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

                        markerCluster.clearMarkers();
                        for (i in pointsSet) {
                            var item = pointsSet[i];
                            var id_point = item.point_id;
                            var metering_values = item.speed_values;
                            var metering_values_by_op = item.speed_values_by_op; // avg
                            var metering_values_by_mdm = item.speed_values_by_mdm;
                            var max_avg_spd_by_op = item.max_avg_spd_by_op;
                            
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
                                var speed_value = 0;
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
                                }
                                item.icon = GetIconImg(ability_icon_url);
                                if (speed_value!=-1){
                                    if (CheckAppropriateSpdVal(speed_value, min, max)){ // если значение скорости попало в интервал - вставляем точку в новый сет
                                        NewPointsSet.push(item);
                                    }
                                }
                            }

                            if ((((curr_op!='Все') && (curr_op!='Оператор')) && ((curr_mtype=='Тип модема') || (curr_mtype=='Все')))){ //- провенряем по оператору и по его скорости
                                var speed_value = 0;

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
                                    }
                                    item.icon = GetIconImg(ability_icon_url);
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
                                        }
                                        item.icon = GetIconImg(ability_icon_url);
                                        if (CheckAppropriateSpdVal(max_avg_spd_by_op, min, max)){ // если значение скорости попало в интервал - вставляем точку в новый сет
                                            NewPointsSet.push(item);
                                        }
                                    }
                                }

                            }

                            if ((((curr_op!='Все') && (curr_op!='Оператор')) && ((curr_mtype!='Тип модема') && (curr_mtype!='Все')))){
                                var speed_value = 0;
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
                                        }
                                        item.icon = GetIconImg(ability_icon_url);
                                        if (CheckAppropriateSpdVal(speed_value, min, max)){ // если значение скорости попало в интервал - вставляем точку в новый сет
                                            NewPointsSet.push(item);
                                        }
                                    }
                                }

                            }
                        }
                    markerCluster.addMarkers(NewPointsSet);
                    
                }

            $( ".map_fullscreen" ).click(function() {
                $('body').toggleClass("fullscreen");
                google.maps.event.trigger(map, 'resize');
            });

});
