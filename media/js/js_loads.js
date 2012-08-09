$(function() {

    var select_set = $('td.operator select')

    var id_option = ''
    for (var i = 0; i <= select_set.length-1; i++)
        {
            var op_id = select_set.eq(i).find('option:selected').val()
            var modem_type_id = select_set.eq(i).parents('tr').find('td.modem_type select').find('option:selected').val()
            if (op_id!='')
                {   // если объект уже был выделен - то загружаем значения и восстанавливаем выделение
                    LoadModemTypes(select_set.eq(i), op_id, modem_type_id)
                }
            else
                {
                    LoadModemTypes(select_set.eq(i), '', '')
                }
        }

    $('td.operator select').live('change', function() {
        LoadModemTypes($(this),$(this).val())
    });

});


function LoadModemTypes(obj, id, curr_modemt_id)
{
    var parent = obj.parents('tr')
    $.ajax({
        url: "/load_modem_types/",
        data: {
            id_operator:id
        },
        type: "POST",
        success: function(data) {
            if (curr_modemt_id!='')
                {
                    parent.find('td.modem_type select').html(data)
                    parent.find('td.modem_type select').find('option[value="'+curr_modemt_id+'"]').attr('selected','selected')
                }
        },
        error:function(jqXHR,textStatus,errorThrown) {
            parent.find('td.modem_type select').html('<option value="" selected="selected">---------</option>');
        }
    });
}
