# -*- coding: utf-8 -*-
import os
from django import http
from django.conf import settings
from django.views.generic.simple import direct_to_template
from pytils.translit import translify
from django.views.decorators.csrf import csrf_exempt
try:
    from PIL import Image
except ImportError:
    import Image
import md5
import datetime
from django.contrib.auth.decorators import login_required
from apps.utils.utils import crop_image
from django.db.models import get_model 

def handle_uploaded_file(f, filename, folder):
    name, ext = os.path.splitext(translify(filename).replace(' ', '_'))
    hashed_name=md5.md5(name+datetime.datetime.now().strftime("%Y%m%d%H%M%S")).hexdigest()
    path_name = settings.MEDIA_ROOT + '/uploads/' + folder + hashed_name + ext
    destination = open(path_name, 'wb+')

    for chunk in f.chunks():
        destination.write(chunk)
    destination.close()
    return '/media/uploads/'+ folder + hashed_name + ext

@csrf_exempt
def upload_img(request):
    if request.user.is_staff:
        if request.method == 'POST':
            url = handle_uploaded_file(request.FILES['file'], request.FILES['file'].name, 'images/')

            #Resizing
            size = 650, 650
            im = Image.open(settings.ROOT_PATH + url)
            imageSize=im.size
            if (imageSize[0] > size[0]) or  (imageSize[1] > size[1]):
                im.thumbnail(size, Image.ANTIALIAS)
                im.save(settings.ROOT_PATH + url, "JPEG", quality = 100)
            return http.HttpResponse('<img src="%s"/>'%url)

        else:
            return http.HttpResponse('error')
    else:
        return http.HttpResponse('403 Forbidden. Authentication Required!')

@csrf_exempt
def upload_file(request):
    if request.user.is_staff:
        if request.method == 'POST':
            url = handle_uploaded_file(request.FILES['file'], request.FILES['file'].name, 'files/')
            url = '<a href="%s" target=_blank>%s</a>' % (url, request.FILES['file'].name)
            return http.HttpResponse(url)
    else:
        return http.HttpResponse('403 Forbidden. Authentication Required!')

@login_required()
@csrf_exempt
def crop_image_view(request, app_name, model_name, id):
    model = get_model(app_name, model_name)
    output_size = model.crop_size
    if request.method != "POST":
        try:
            image = model.objects.get(pk=id).image
            return direct_to_template(request, 'admin/crop_image.html', locals())
        except model.DoesNotExist:
            raise http.Http404('Object not found')
    else:
        original_img = model.objects.get(pk=id)
        crop_image(request.POST, original_img, output_size)

    next = request.path.replace('crop/', '')
    return http.HttpResponseRedirect(next)