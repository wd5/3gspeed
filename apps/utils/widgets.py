# -*- coding: utf-8 -*-
from django import forms
import os
from django.utils.safestring import mark_safe
import settings

class Redactor(forms.Textarea):
    toolbar = u'default' #'mini'
    class Media:
        js = (
            '/media/js/jquery.js',
            '/media/js/redactor/redactor.js',
            )
        css = {
            'all': ('/media/js/redactor/css/redactor.css',)
        }

    def __init__(self, attrs=None):
        self.attrs = attrs
        if attrs:
            self.attrs.update(attrs)
        super(Redactor,self).__init__(attrs)

    def render(self,name,value,attrs=None):
        rendered = super(Redactor,self).render(name, value, attrs)
        return rendered + mark_safe(u'''<script type="text/javascript">
        $(document).ready(
            function()
            {
                $('#id_%s').redactor({
                    focus: true,
                    toolbar:'%s',
                    imageUpload:'/upload_img/',
                    fileUpload:'/upload_file/',
                    lang:'ru'
                });
            }
        );
        </script>''' % (name,self.toolbar))

class RedactorMini(Redactor):
    toolbar = u'mini'

class RedactorClassic(Redactor):
    toolbar = u'classic'


#class RedactorMicro(Redactor):
#    toolbar = u'micro'

class ColorPicker(forms.TextInput): # используется так же как редактор
    class Media:
        js = (
            '/media/js/jquery.js',
            '/media/js/color_picker/jquery.miniColors.js',
            )
        css = {
            'all': ('/media/js/color_picker/jquery.miniColors.css',)
        }

    def render(self,name,value,attrs=None):
        attrs = {'class':'color-picker', 'size':"6"}
        rendered = super(ColorPicker,self).render(name, value, attrs)
        return rendered + mark_safe(u'''<script type="text/javascript">
            $(document).ready( function() {
                $(".color-picker").miniColors({
                    letterCase: 'uppercase',
                    change: function(hex, rgb) {
                        logData('change', hex, rgb);
                    },
                    open: function(hex, rgb) {
                        logData('open', hex, rgb);
                    },
                    close: function(hex, rgb) {
                        logData('close', hex, rgb);
                    }
                });
            });
        </script>''')

class AdminImageCrop(forms.FileInput):
    path = ''
    img_width = 200

    def get_url(self, value):
        return u'<br><a href="/admin/crop/%s/%s/">Изменить миниатюру</a>' \
                % (self.path, value.instance.id)

    def get_img(self, url):
        file, ext = os.path.splitext(url)
        file = u'%s_crop.jpg' % file
        if os.path.isfile( settings.ROOT_PATH +file):
            url_img = file
        else:
            url_img = url
        return u'<img src="%s" style="width: %spx;" />' % (url_img, self.img_width)

    def render(self, name, value, attrs=None):
        if 'path' in self.attrs:
            self.path = self.attrs['path']
        if 'img_width' in self.attrs:
            self.img_width = self.attrs['img_width']
        output = []
        if value and hasattr(value, "url"):
            output.append((u'<a target="_blank" href="%s">%s</a>%s' % (value.url, self.get_img(value.url), self.get_url(value))))
        output.append(super(AdminImageCrop, self).render(name, value, attrs))
        return mark_safe(u''.join(output))