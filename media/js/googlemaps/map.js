$(function(){

    var map;
    var lat;
    var lng;
    var infowindow;
    var initialLocation = new google.maps.LatLng(59.934849, 30.330627);
    var hystory;

    var map_options = {
        zoom: 12,
        center: initialLocation,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    function init() {
        map = new google.maps.Map(document.getElementById("map"), map_options);

        var markers = [];
        downloadUrl("phpsqlajax_genxml.php", function(data) {
            var xml = data.responseXML;
            var xmlMarkers = xml.documentElement.getElementsByTagName("marker");
            for (var i = 0; i < xmlMarkers.length; i++) {
                var point = new google.maps.LatLng(
                  parseFloat(xmlMarkers[i].getAttribute("latitude")),
                  parseFloat(xmlMarkers[i].getAttribute("longitude")));
                var beeline = xmlMarkers[i].getElementsByTagName("beeline");
                var megafon = xmlMarkers[i].getElementsByTagName("megafon");
                var mts = xmlMarkers[i].getElementsByTagName("mts");
                var beelineDownload = beeline[0].getAttribute("download");
                var beelineUpload = beeline[0].getAttribute("upload");
                var megafonDownload = megafon[0].getAttribute("download");
                var megafonUpload = megafon[0].getAttribute("upload");
                var mtsDownload = mts[0].getAttribute("download");
                var mtsUpload = mts[0].getAttribute("upload");

                var marker = new google.maps.Marker({
                    position: point,
                });

                marker.downloadBeeline = beelineDownload;
                marker.uploadBeeline = beelineUpload;
                marker.downloadMegafon = megafonDownload;
                marker.uploadMegafon = megafonUpload;
                marker.downloadMts = mtsDownload;
                marker.uploadMts = mtsUpload;

                createInfoWindow(marker);

                markers.push(marker);
            }

            var cluster_options = {
                maxZoom: 18,
                zoomOnClick: false
            };
            var markerCluster = new MarkerClusterer(map, markers, cluster_options);
        });

        map.controls[google.maps.ControlPosition.RIGHT_TOP].push(new HistoryBox());
    }

    function createInfoWindow (marker) {
        var contentString = [
            '<div id="baloon">'
            ,'<div class="baloon-header">'
            ,'<div class="bh-download">Download</div><div class="bh-upload">Upload</div>'
            ,'</div>'
            ,'<div class="operator" id="beeline">'
            ,'<div class="logo">'
            ,'<div id="beeline-logo"></div>'
            ,'</div>'
            ,'<div class="content">'
            ,'<div class="download">'
            ,'<div class="speed">'
            ,'<div class="num">' + marker.downloadBeeline + '</div>'
            ,'<div class="measure">Мбит/сек.</div>'
            ,'</div>'
            ,'</div>'
            ,'<div class="upload">'
            ,'<div class="speed">'
            ,'<div class="num">' + marker.uploadBeeline + '</div>'
            ,'<div class="measure">Мбит/сек.</div>'
            ,'</div>'
            ,'</div>'
            ,'</div>'
            ,'</div>'
            ,'<div class="operator" id="megafon">'
            ,'<div class="logo">'
            ,'<div id="megafon-logo"></div>'
            ,'</div>'
            ,'<div class="content">'
            ,'<div class="download">'
            ,'<div class="speed">'
            ,'<div class="num">' + marker.downloadMegafon + '</div>'
            ,'<div class="measure">Мбит/сек.</div>'
            ,'</div>'
            ,'</div>'
            ,'<div class="upload">'
            ,'<div class="speed">'
            ,'<div class="num">' + marker.uploadMegafon + '</div>'
            ,'<div class="measure">Мбит/сек.</div>'
            ,'</div>'
            ,'</div>'
            ,'</div>'
            ,'</div>'
            ,'<div class="operator" id="mts">'
            ,'<div class="logo">'
            ,'<div id="mts-logo"></div>'
            ,'</div>'
            ,'<div class="content">'
            ,'<div class="download">'
            ,'<div class="speed">'
            ,'<div class="num">' + marker.downloadMts + '</div>'
            ,'<div class="measure">Мбит/сек.</div>'
            ,'</div>'
            ,'</div>'
            ,'<div class="upload">'
            ,'<div class="speed">'
            ,'<div class="num">' + marker.uploadMts + '</div>'
            ,'<div class="measure">Мбит/сек.</div>'
            ,'</div>'
            ,'</div>'
            ,'</div>'
            ,'</div>'
            ,'<small id="left"></small><small id="right"></small>'
            ,'</div>'
        ].join('');

        var infobox_options = {
            content: contentString
            ,disableAutoPan: false
            ,maxWidth: 0
            ,pixelOffset: new google.maps.Size(-137, -219)
            ,zIndex: null
            ,boxStyle: {
                opacity: 1
                ,width: "290px"
            }
            ,closeBoxMargin: "10px 12px 2px 2px"
            ,closeBoxURL: "img/close.png"
            ,infoBoxClearance: new google.maps.Size(1, 1)
            ,isHidden: false
            ,pane: "floatPane"
            ,enableEventPropagation: false
        };

        google.maps.event.addListener(marker, "click", function (e) {
            if(infowindow)
                infowindow.close();
            ib.open(map, this);
            infowindow = ib;
        });

        var ib = new InfoBox(infobox_options);

        google.maps.event.addListener(ib, 'closeclick', function() {
            hystory.hide();
        });

        google.maps.event.addListener(marker, 'click', function() {
            var pos = this.getPosition();
            lat = pos.lat();
            lng = pos.lng();
            var params = {
                lat: lat,
                lng: lng
            };

            var ajaxQuery = $.param(params);
            $.ajax({
                type: "POST",
                url: "phpsqlajax_gendates.php",
                data: ajaxQuery,
                success: function(html){
                    var options = '';
                    var dates = html.documentElement.getElementsByTagName("date");

                    var prevhystory = hystory;

                    if (dates.length > 1) {
                        for (var i = 0; i < dates.length; i++) {
                            var date = dates[i].getAttribute("date");
                            options += '<option value="' + date + '">' + date + '</option>';
                        }

                        $("select#history-list").html(options);
                        hystory = $("select#history-list");

                        $('select#history-list').change(function() {
                            var date = $(this).val();

                            var params = {
                                lat: lat,
                                lng: lng,
                                date: date
                            };

                            var ajaxQuery = $.param(params);
                            $.ajax({
                                type: "POST",
                                url: "phpsqlajax_gendatecontent.php",
                                data: ajaxQuery,
                                success: function(html){
                                    var marker = html.documentElement;

                                    var beeline = marker.getElementsByTagName("beeline");
                                    var megafon = marker.getElementsByTagName("megafon");
                                    var mts = marker.getElementsByTagName("mts");

                                    var beelineDownload = beeline[0].getAttribute("download");
                                    var beelineUpload = beeline[0].getAttribute("upload");
                                    var megafonDownload = megafon[0].getAttribute("download");
                                    var megafonUpload = megafon[0].getAttribute("upload");
                                    var mtsDownload = mts[0].getAttribute("download");
                                    var mtsUpload = mts[0].getAttribute("upload");

                                    $("#baloon #beeline .download .num").text(beelineDownload);
                                    $("#baloon #beeline .upload .num").text(beelineUpload);
                                    $("#baloon #megafon .download .num").text(megafonDownload);
                                    $("#baloon #megafon .upload .num").text(megafonUpload);
                                    $("#baloon #mts .download .num").text(mtsDownload);
                                    $("#baloon #mts .upload .num").text(mtsUpload);
                                }
                            });
                        });
                    } else {
                        $("#history-field").val(dates[0].getAttribute("date"));
                        hystory = $("#history-field");
                    }

                    if (prevhystory !== undefined && prevhystory[0] !== hystory[0])
                        prevhystory.hide();
                    hystory.show();
                }
            });
        });

        return ib;
    }

    function HistoryBox() {
        var textBox = $('<input type="text" id="history-field" value="" readonly/>');
        var selectBox = $('<select id="history-list"></select>');

        var div = $('<div id="historyBox"></div>')
            .append(textBox).append(selectBox);

        return div.get(0);
    }

    function downloadUrl(url, callback) {
        var request = window.ActiveXObject ?
            new ActiveXObject('Microsoft.XMLHTTP') :
            new XMLHttpRequest;

        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                request.onreadystatechange = doNothing;
                callback(request, request.status);
            }
        };

        request.open('GET', url, true);
        request.send(null);
    }

    function doNothing() {}

    google.maps.event.addDomListener(window, 'load', init);

});
