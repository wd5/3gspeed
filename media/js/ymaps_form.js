$(function(){
    $('#id_map').replaceWith('<div id="admin_map" style="height:456px;width:960px;"></div>');

    var geopoint = $('#id_coord').val();

    var scale = 13;
    var flag = true;
    if (geopoint == ''){
        geopoint = '59.930879,30.329349';
        geopoint = geopoint.split(',');
        scale = 13;
        flag = false;
    }
    else{
        geopoint = geopoint.split(',');
    }


        ymaps.ready(function () {
            var map = new ymaps.Map("admin_map",
                {
                    center: [geopoint[0],geopoint[1]],
                    zoom: scale,
                    type: "yandex#map"
                }
            );

            map.controls.add("zoomControl");
            var placemark;
            if(flag){
                placemark = new ymaps.Placemark(
                    [geopoint[0],geopoint[1]],
                    {
                        'balloonContent': $('#id_name').val()
                    }
                );

                map.geoObjects.add(placemark);
            }

            map.events.add('click', function (e) {
                if(placemark){
                    map.geoObjects.remove(placemark);
                }
                map.balloon.close();
                var coords = e.get('coordPosition');
                $('#id_coord').val(coords);

                map.balloon.open(coords,
                {
                    contentHeader: $('#id_title').val(),
                    contentBody:
                        '<p>Координаты: ' + [
                            coords[0].toPrecision(6),
                            coords[1].toPrecision(6)
                        ].join(', ') + '</p>',
                    contentFooter: '<sup>Щелкните еще раз</sup>'
                });

                placemark = new ymaps.Placemark(
                    [coords[0],coords[1]],
                    {
                        'balloonContent': $('#id_title').val()
                    }
                );
                map.geoObjects.add(placemark);



            });

        });
    });