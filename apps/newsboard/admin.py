# -*- coding: utf-8 -*-
from django.contrib import admin
from django import forms
from apps.utils.widgets import Redactor
from models import News, NewsImage
from sorl.thumbnail.admin import AdminImageMixin

class NewsAdminForm(forms.ModelForm):
    short_text = forms.CharField(
        widget=Redactor(attrs={'cols': 170, 'rows': 10}),
        label = u'Анонс', required=False
    )
    text = forms.CharField(
        widget=Redactor(attrs={'cols': 170, 'rows': 30}),
        label = u'Текст', required=False
    )
    class Meta:
        model = News

class NewsImageInline(AdminImageMixin, admin.TabularInline):
    model = NewsImage

class NewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'date_add', 'is_published', )
    list_display_links = ('title',)
    list_filter = ('is_published', )
    form = NewsAdminForm
    inlines = [NewsImageInline, ]
    date_hierarchy = 'date_add'

admin.site.register(News, NewsAdmin)
