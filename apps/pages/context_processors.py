# -*- coding: utf-8 -*-
from apps.pages.models import MetaData

def meta(request):
    try:
        meta = MetaData.objects.get(url = request.path)
    except MetaData.DoesNotExist:
        try:
            meta = MetaData.objects.get(url = u'/')
        except MetaData.DoesNotExist:
            meta = False

    return {
        'meta': meta,
    }    