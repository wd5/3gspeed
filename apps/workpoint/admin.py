# -*- coding: utf-8 -*-
from django.contrib import admin
from django import forms
from apps.utils.widgets import Redactor
from sorl.thumbnail.admin import AdminImageMixin
from models import Ability, Distinct, City, Point, SpeedAtPoint, ModemType, Operator

class AbilityAdmin(AdminImageMixin, admin.ModelAdmin):
    list_display = ('id','title','download_speed',)
    list_display_links = ('id','title',)
    list_editable = ('download_speed',)
    search_fields = ('title','download_speed',)
    list_filter = ('download_speed',)

admin.site.register(Ability, AbilityAdmin)

class CityAdminForm(forms.ModelForm):
    class Meta:
        model = City

    class Media:
        js = (
            '/media/js/jquery.js',
            'http://api-maps.yandex.ru/2.0/?load=package.full&mode=debug&lang=ru-RU',
            '/media/js/ymaps_form.js',
        )


class DistinctInline(admin.TabularInline):
    fields = ('title', 'is_published')
    model = Distinct

class CityAdmin(admin.ModelAdmin):
    list_display = ('id','title','coord','is_published',)
    list_display_links = ('id','title','coord',)
    list_editable = ('is_published',)
    search_fields = ('title',)
    list_filter = ('is_published',)
    form = CityAdminForm
    inlines = [DistinctInline,]

admin.site.register(City, CityAdmin)

class SpeedAtPointInline(admin.TabularInline):
    fields = ('operator', 'modem_type', 'internet_speed')
    model = SpeedAtPoint

class PointAdminForm(forms.ModelForm):
    class Meta:
        model = Point

    class Media:
        js = (
            '/media/js/jquery.js',
            'http://api-maps.yandex.ru/2.0/?load=package.full&mode=debug&lang=ru-RU',
            '/media/js/ymaps_form.js',
            '/media/js/js_loads.js',
        )


class PointAdmin(admin.ModelAdmin):
    list_display = ('id','distinct','coord','datetime_create',)
    list_display_links = ('id','distinct','coord','datetime_create',)
    list_filter = ('datetime_create','distinct',)
    inlines = [SpeedAtPointInline,]
    form = PointAdminForm

admin.site.register(Point, PointAdmin)

class ModemTypeInline(admin.TabularInline):
    fields = ('vendor', 'model', 'download_speed')
    model = ModemType

class OperatorAdmin(AdminImageMixin, admin.ModelAdmin):
    list_display = ('id','title','order', 'is_published',)
    list_display_links = ('id','title',)
    list_editable = ('order', 'is_published',)
    search_fields = ('title',)
    list_filter = ('is_published',)
    inlines = [ModemTypeInline,]

admin.site.register(Operator, OperatorAdmin)


