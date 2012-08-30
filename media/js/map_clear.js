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

            function getJSONPoints(id_city){
                var url = '/get_points_json_test/';
                if (id_city){
                    url += '?city_id=' + id_city;
                    $('.map_preload').show();
                }
                $.getJSON(url, function(json){
                    pointsSet = [];

                    $.each(json.points, function(i, point){
                        coord = point.coord.split(',');
                        var placemark = new ymaps.Placemark(coord,
                            {
                                balloonContent: '',
                            },
                            {
                                hideIconOnBalloonOpen: false,
                                openBalloonOnClick: false,
                                // Изображение иконки метки
                                balloonLayout: "default#imageWithContent",
                                balloonContentSize: [360, 258],
                                balloonImageOffset: [-188, -320],
                                balloonShadow: false,
                                balloonAutoPan: false,
                                //balloonAutoPanDuration: 100,
                                //balloonAutoPanMargin: 265,
                            }
                        );
                        placemark.events.add('click', function () {
                            if(placemark.balloon.isOpen()) {
                                placemark.balloon.close();
                            }
                            else {
                                placemark.balloon.open();
                            }
                            var id_point = placemark.properties.get('point_id')
                            $.get('/load_balloon_content/', {id_point: id_point, op_title: curr_op}, function(data){
                                //placemark.properties.set('balloonContent', data);
                                
                            });

                        });
                        pointsSet.push(placemark);
                    });

                    clusterer = new ymaps.Clusterer();
                    clusterer.add(pointsSet);
                    map.geoObjects.add(clusterer);
                    $('.map_preload').hide();
                    searchAddress();
                });
            }

            if ($('#cityID').val()){
                getJSONPoints($('#cityID').val());
            } else {
                getJSONPoints();
            }

            $('.map_popup_close').live('click', function(){
                map.balloon.close()
            });
            //не понял, зачем здесь это?
            map.events.add('click', function (item) {
                map.balloon.close();
            });


        });
    });
