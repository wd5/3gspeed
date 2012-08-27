# -*- coding: utf-8 -*-
from apps.workpoint.models import Point
from apps.siteblocks.models import Settings
import datetime

def is_processing(request):
    try:
        period = Settings.objects.get(name='last_time').value
        period = int(period)
    except:
        period = False

    if period:
        td = datetime.timedelta(minutes=period)
        last_dtime = datetime.datetime.now() - td
        point_set = Point.objects.filter(datetime_create__gte=last_dtime).order_by('-datetime_create')
        if point_set:
            processing = point_set[0]
        else:
            processing = False
    else:
        processing = False

    return {
        'processing': processing,
    }