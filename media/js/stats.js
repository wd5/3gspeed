$(function(){
    $.widget("ui.combobox", {
        _create: function() {
            var input,
                self = this,
                select = this.element.hide(),
                selected = select.children( ":selected" ),
                value = selected.val() ? selected.text() : "",
                wrapper = this.wrapper = $( "<span>" )
                    .addClass( "ui-combobox" )
                    .insertAfter( select );

            input = $( "<input>" )
                .appendTo( wrapper )
                .val( value )
                .addClass( "ui-state-default ui-combobox-input" )
                .autocomplete({
                    delay: 0,
                    minLength: 0,
                    source: function( request, response ) {
                        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
                        response( select.children( "option" ).map(function() {
                            var text = $( this ).text();
                            if ( this.value && ( !request.term || matcher.test(text) ) )
                                return {
                                    label: text.replace(
                                        new RegExp(
                                            "(?![^&;]+;)(?!<[^<>]*)(" +
                                            $.ui.autocomplete.escapeRegex(request.term) +
                                            ")(?![^<>]*>)(?![^&;]+;)", "gi"
                                        ), "<strong>$1</strong>" ),
                                    value: text,
                                    option: this
                                };
                        }) );
                    },
                    select: function( event, ui ) {
                        ui.item.option.selected = true;
                        self._trigger( "selected", event, {
                            item: ui.item.option
                        });
                    },
                    change: function( event, ui ) {
                        if ( !ui.item ) {
                            var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
                                valid = false;
                            select.children( "option" ).each(function() {
                                if ( $( this ).text().match( matcher ) ) {
                                    this.selected = valid = true;
                                    return false;
                                }
                            });
                            if ( !valid ) {
                                // remove invalid value, as it didn't match anything
                                $( this ).val( "" );
                                select.val( "" );
                                input.data( "autocomplete" ).term = "";
                                return false;
                            }
                        }
                    }
                })
                .addClass( "ui-widget ui-widget-content ui-corner-left" );

            input.data( "autocomplete" )._renderItem = function( ul, item ) {
                return $( "<li></li>" )
                    .data( "item.autocomplete", item )
                    .append( "<a>" + item.label + "</a>" )
                    .appendTo( ul );
            };

            $( "<a>" )
                .attr( "tabIndex", -1 )
                .attr( "title", "Show All Items" )
                .appendTo( wrapper )
//                          .button({
//                              icons: {
//                                  primary: "ui-icon-triangle-1-s"
//                              },
//                              text: false
//                          })
                .removeClass( "ui-corner-all" )
                .addClass( "ui-corner-right ui-combobox-toggle" )
                .click(function() {
                    // close if already visible
                    if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
                        input.autocomplete( "close" );
                        return;
                    }

                    // work around a bug (likely same cause as #5265)
                    $( this ).blur();

                    // pass empty string as value to search for, displaying all results
                    input.autocomplete( "search", "" );
                    input.focus();
                });
            if (select.attr('rel')){
                $( "<a>" )
                    .appendTo( wrapper )
                    .attr( {"href":"#" , 'rel':select.attr('rel')} )
                    .addClass( "add_client_form" )
                }
            },

        destroy: function() {
            this.wrapper.remove();
            this.element.show();
            $.Widget.prototype.destroy.call( this );
        }
    });

    $(".combobox").combobox({
         selected: function(event, ui) {
            alert('123');
         } // selected
      });


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
                        $('div.stat_distinct').html('<div class="select_curr" name="0">Улица<div></div></div><div class="select_drop"><ul>'+ data +'</ul></div>')
                    },
                    error:function(jqXHR,textStatus,errorThrown) {
                        $('div.stat_distinct').html('<div class="select_curr" name="0">Улица<div></div></div><div class="select_drop"><ul></ul></div>')
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