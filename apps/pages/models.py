# -*- coding: utf-8 -*-
from django.utils.translation import ugettext_lazy as _
import os
from django.db import models
from sorl.thumbnail.fields import ImageField

from apps.utils.models import BaseDoc, BasePic
from apps.utils.managers import PublishedManager
from mptt.models import MPTTModel, TreeForeignKey, TreeManager

class Page(MPTTModel):
    date_add = models.DateTimeField(verbose_name=u'Дата создания', editable=False, auto_now_add=True)
    title = models.CharField(max_length=120, verbose_name=u'Заголовок страницы', blank=True)
    url = models.CharField(max_length=200, verbose_name=u'Адрес', unique=True, help_text=u'Адрес страницы на латинице. Например, "/your_address/"')
    parent = TreeForeignKey('self', verbose_name=u'Родительская страница', related_name='children', blank=True, null=True, on_delete=models.SET_NULL)
    content = models.TextField(verbose_name=u'Содержимое страницы')
    order = models.IntegerField(verbose_name=u'Порядок сортировки',default=10)

    is_published = models.BooleanField(verbose_name=u'Опубликовано', default = True)
    is_at_menu = models.BooleanField(verbose_name=u'Отображать в меню', default = False)
    is_at_footer_menu = models.BooleanField(verbose_name=u'Отображать в нижнем меню', default = False)
    template = models.CharField(verbose_name=u'шаблон', max_length=100, editable=False, default=u'default.html')

    objects = TreeManager()

    #@models.permalink
    def get_absolute_url(self):
        return self.url

    class Meta:
        verbose_name = _(u'page_item')
        verbose_name_plural = _(u'page_items')

    class MPTTMeta:
        order_insertion_by = ['order']

    def __unicode__(self):
        return u'%s (%s)' % (self.title, self.get_absolute_url())


    def save(self, **kwargs):
        # add the first and the last slash if it needed
        if not self.url.endswith('/'):
            self.url += '/'
        if not self.url.startswith('/'):
            self.url = "/" + self.url

        # remove the first and the last space
        self.title = self.title.strip()
 
        super(Page, self).save(**kwargs)


class PageDoc(BaseDoc):
    page = models.ForeignKey(
        Page,
        verbose_name = u'страница',
    )

    class Meta:
        verbose_name = u'файл'
        verbose_name_plural = u'файлы'

    def __unicode__(self):
        return u'%s' % self.title

    def get_upload_path(self, filename):
        return os.path.join('files', 'page_docs')

class PagePic(BasePic):
    page = models.ForeignKey(
        Page,
        verbose_name = u'страница',
    )

    class Meta:
        verbose_name = u'картинка'
        verbose_name_plural = u'картинки'

    def __unicode__(self):
        return u'%s' % self.title

    def get_upload_path(self, filename):
        return os.path.join('files', 'page_pics')


class MetaData(models.Model):
    url = models.CharField(max_length=100, verbose_name=u'Адрес', help_text=u'Адрес страницы,например, "/your_address/"')
    title = models.CharField(max_length=100, verbose_name=u'Заголовок')
    description = models.CharField(max_length=100, verbose_name=u'description', blank=True)
    keywords = models.CharField(max_length=100, verbose_name=u'keywords', blank=True)

    class Meta:
        verbose_name = u'meta'
        verbose_name_plural = u'meta'

    def __unicode__(self):
        return u'%s| %s' % (self.url, self.title)


    def save(self, force_insert=False, force_update=False, using=None):
        # add the first and the last slash if it needed
        if not self.url.endswith('/'):
            self.url += '/'
        if not self.url.startswith('/'):
            self.url = '/' + self.url

        if force_insert and force_update:
            raise ValueError("Cannot force both insert and updating in model saving.")
        self.save_base(using=using, force_insert=force_insert, force_update=force_update)

    save.alters_data = True