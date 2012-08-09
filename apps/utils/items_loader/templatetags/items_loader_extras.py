# -*- coding: utf-8 -*-
from django import template
from django.db.models.loading import get_model

register = template.Library()

@register.inclusion_tag("items_loader/base_loader.html")
def block_items_loader(queryset, model_name, app_name, template_name, load_count, add_id, add_parameter):
    if add_parameter == '':
        add_parameter = False
    if add_id == '':
        add_id = False

    init_count = queryset.count()

    model = get_model(app_name, model_name)
    if add_parameter and add_id:
        try:
            qs_item = model.objects.get(id=add_id)
            try:
                exec('full_queryset = qs_item.%s' % add_parameter)
                count = full_queryset.count()
            except:
                count = False
        except model.DoesNotExist:
            count = False
    elif model:
        try:
            full_queryset = model.objects.published()
            count = full_queryset.count()
        except model.DoesNotExist:
            count = False

    if count:
        if count > init_count:
            next_count = count-init_count
        else:
            next_count = False
    else:
        next_count = False

    load_template = 'items_loader/%s_load_template.html' % template_name
    return {
        'items': queryset,
        'model_name': model_name,
        'app_name': app_name,
        'add_parameter': add_parameter,
        'add_id': add_id,
        'load_template': load_template,
        'template_name': template_name,
        'load_count':load_count,
        'initial': True,
        'next_count':next_count
    }