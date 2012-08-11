# -*- coding: utf-8 -*-
from django.conf.urls.defaults import patterns, include, url
from django.views.decorators.csrf import csrf_exempt
from apps.workpoint.views import load_modem_types, load_balloon_content, load_point_marker, about_page, statistic_page, load_city_distincts, load_stat_city_div
from apps.newsboard.views import news_detail
from views import index, db_copy
#from apps.app.urls import urlpatterns as app_url


urlpatterns = patterns('',
    url(r'^$',index, name='index'),
    url(r'^about/$',about_page, name='about'),
    url(r'^statistic/$',statistic_page, name='statistic'),
    (r'^news/(?P<pk>\d*)/$', news_detail),
    (r'^load_modem_types/$',csrf_exempt(load_modem_types)),
    (r'^load_balloon_content/$',csrf_exempt(load_balloon_content)),
    (r'^load_point_marker/$',csrf_exempt(load_point_marker)),
    (r'^load_city_distincts/$',csrf_exempt(load_city_distincts)),
    (r'^load_stat_city_div/$',csrf_exempt(load_stat_city_div)),
    #url(r'^faq/', include('apps.faq.urls')),





    #(r'^shop_point_label/(?P<pk>\d*)/$',shop_point_label),
    #(r'^database_copy/$',db_copy),
)
#url(r'^captcha/', include('captcha.urls')),

#urlpatterns += #app_url


