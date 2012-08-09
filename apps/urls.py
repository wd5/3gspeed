# -*- coding: utf-8 -*-
from django.conf.urls.defaults import patterns, include, url
from django.views.decorators.csrf import csrf_exempt
from apps.workpoint.views import load_modem_types
#from apps.app.urls import urlpatterns as app_url

from views import index, db_copy

urlpatterns = patterns('',
    url(r'^$',index, name='index'),
    (r'^load_modem_types/$',csrf_exempt(load_modem_types)),
    #url(r'^faq/', include('apps.faq.urls')),

    #(r'^database_copy/$',db_copy),



)
#url(r'^captcha/', include('captcha.urls')),

#urlpatterns += #app_url


