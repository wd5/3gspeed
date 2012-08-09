# -*- coding: utf-8 -*-
from django.contrib import admin
from django.utils.translation import ugettext_lazy as _
from django.utils.text import capfirst
from django.db.models.base import ModelBase
from django.conf import settings
from pymorphy import get_morph

morph = get_morph(settings.PYMORPHY_DICTS['ru']['dir'])

class I18nLabel():
    def __init__(self, function):
        self.target = function
        self.app_label = u''

    def rename(self, f, name = u''):
        def wrapper(*args, **kwargs):
            extra_context = kwargs.get('extra_context', {})
            extra_context['app_label'] = _(extra_context.get('app_label', self.app_label))
            if 'delete_view' != f.__name__:
                extra_context['title'] = self.get_title_by_name(f.__name__, args[1], name)
            else:
                extra_context['object_name'] = morph.inflect_ru(name, u'вн').lower()
            kwargs['extra_context'] = extra_context
            return f(*args, **kwargs)
        return wrapper

    def get_title_by_name(self, name, request={}, obj_name = u''):
        if 'add_view' == name:
            return _('Add %s') % morph.inflect_ru(obj_name, u'вн').lower()
        elif 'change_view' == name:
            return _('Change %s') % morph.inflect_ru(obj_name, u'вн').lower()
        elif 'changelist_view' == name:
            if 'pop' in request.GET:
                title = _('Select %s')
            else:
                title = _('Select %s to change')
            return title % morph.inflect_ru(obj_name, u'вн').lower()
        else:
            return ''

    def wrapper_register(self, model_or_iterable, admin_class=None, **option):
        if isinstance(model_or_iterable, ModelBase):
            model_or_iterable = [model_or_iterable]
        for model in model_or_iterable:
            if admin_class is None:
                admin_class = type(model.__name__+'Admin', (admin.ModelAdmin,), {})
            self.app_label = model._meta.app_label
            current_name = model._meta.verbose_name.upper()
            admin_class.add_view = self.rename(admin_class.add_view, current_name)
            admin_class.change_view = self.rename(admin_class.change_view, current_name)
            admin_class.changelist_view = self.rename(admin_class.changelist_view, current_name)
            admin_class.delete_view = self.rename(admin_class.delete_view, current_name)
        return self.target(model, admin_class, **option)

    def wrapper_app_index(self, request, app_label, extra_context=None):
        if extra_context is None:
            extra_context = {}
        extra_context['title'] = _('%s administration') % _(capfirst(app_label))
        return self.target(request, app_label, extra_context)

    def register(self):
        return self.wrapper_register

    def index(self):
        return self.wrapper_app_index

admin.site.register = I18nLabel(admin.site.register).register()
admin.site.app_index = I18nLabel(admin.site.app_index).index()