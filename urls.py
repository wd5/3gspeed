from django.conf.urls.defaults import patterns, include, url

from django.contrib import admin
from django.conf import settings

from apps.urls import urlpatterns as apps_urlpatterns


admin.autodiscover()

urlpatterns = patterns('',
    (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
    (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}),

    # Admin
    url(r'^admin/', include(admin.site.urls)),
    url(r'^admin_tools/', include('admin_tools.urls')),
	(r'^admin/crop/(?P<app_name>\w+)/(?P<model_name>\w+)/(?P<id>\d+)/$', 'views.crop_image_view'),
     #Redactor
    (r'^upload_img/$', 'views.upload_img'),
    (r'^upload_file/$', 'views.upload_file'),

)

urlpatterns += apps_urlpatterns
