# -*- coding: utf-8 -*-
from django.conf.urls.defaults import patterns, include, url
from django.views.decorators.csrf import csrf_exempt
from apps.workpoint.views import load_modem_types, load_balloon_content, load_point_marker, about_page, statistic_page, load_city_distincts, load_stat_city_div, load_city_stat, load_city_avg_speed
from apps.newsboard.views import news_detail, load_items_news_about
from views import index, db_copy, points_list_json
from django.views.decorators.cache import cache_page
from apps.utils.items_loader.views import items_loader
#from apps.app.urls import urlpatterns as app_url


urlpatterns = patterns('',
    url(r'^$',index, name='index'),
    (r'^load_items/$',csrf_exempt(items_loader)),
    (r'^load_items_news_about/$',csrf_exempt(load_items_news_about)),
    url(r'^get_points_json/$', points_list_json),
    url(r'^about/$',about_page, name='about'),
    url(r'^statistic/$',cache_page(statistic_page, 60 * 15), name='statistic'),
    (r'^news/(?P<pk>\d*)/$', news_detail),
    (r'^load_modem_types/$',csrf_exempt(load_modem_types)),
    (r'^load_balloon_content/$',csrf_exempt(load_balloon_content)),
    (r'^load_point_marker/$',csrf_exempt(load_point_marker)),
    (r'^load_city_distincts/$',csrf_exempt(load_city_distincts)),
    (r'^load_stat_city_div/$',csrf_exempt(load_stat_city_div)),
    (r'^load_city_stat/$',csrf_exempt(load_city_stat)),
    (r'^load_city_avg_speed/$',csrf_exempt(load_city_avg_speed)),
    #url(r'^faq/', include('apps.faq.urls')),





    #(r'^shop_point_label/(?P<pk>\d*)/$',shop_point_label),
    #(r'^database_copy/$',db_copy),
)
#url(r'^captcha/', include('captcha.urls')),

#urlpatterns += #app_url


