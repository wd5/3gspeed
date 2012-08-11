# -*- coding: utf-8 -*-
import os
from datetime import datetime
from django.db import models
from django.utils.translation import ugettext_lazy as _
from pytils.translit import translify

from sorl.thumbnail import ImageField as sorl_ImageField
from apps.utils.managers import PublishedManager


class ImageField(sorl_ImageField, models.ImageField):
    pass

def file_path_News(instance, filename):
    return os.path.join('images','news',  translify(filename).replace(' ', '_') )

class News(models.Model):
    title = models.CharField(verbose_name = u'Заголовок', max_length = 250,)
    short_text = models.TextField(verbose_name = u'Анонс', blank=True)
    text = models.TextField(verbose_name = u'Текст', blank=True)
    code_video = models.TextField(verbose_name=u'код видеоролика', blank=True)
    is_published = models.BooleanField(verbose_name = u'Опубликовано', default = True,)
    date_add = models.DateTimeField(verbose_name = u'Дата создания', default = datetime.now)

    # Managers
    objects = PublishedManager()

    class Meta:
        ordering = ['-date_add', '-id',]
        verbose_name =_(u'news_item')
        verbose_name_plural =_(u'news_items')
        get_latest_by = 'date_add'

    def __unicode__(self):
        return self.title

    def get_images(self):
        return self.newsimage_set.all()

    def get_three_images(self):
        return self.newsimage_set.all()[:3]

    def get_count_images(self):
        count = self.newsimage_set.all().count()
        return count

class NewsImage(models.Model):
    new = models.ForeignKey(News, verbose_name=u'новость')
    image = ImageField(verbose_name=u'изображение', upload_to=file_path_News)
    order = models.IntegerField(verbose_name=u'Порядок сортировки',default=10)

    class Meta:
        ordering = ['-order',]
        verbose_name =_(u'new_photo')
        verbose_name_plural =_(u'new_photos')

    def __unicode__(self):
        return u'изображение новости №%s' %self.new.id