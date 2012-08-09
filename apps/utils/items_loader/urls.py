# -*- coding: utf-8 -*-
from django.conf.urls.defaults import patterns
from apps.utils.items_loader.views import items_loader
from django.views.decorators.csrf import csrf_exempt

urlpatterns = patterns('',

    (r'^load_items/$',csrf_exempt(items_loader)),

)
