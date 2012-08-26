# -*- coding: utf-8 -*-
from django.utils.translation import ugettext_lazy as _
from datetime import date, datetime, timedelta
from django.views.generic import ListView, CreateView, DetailView
from django.contrib.syndication.views import Feed
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.views.generic import View
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest
from django.db.models.loading import get_model
from django.template.loader import render_to_string

from models import News

class NewsListView(ListView):
    model = News
    context_object_name = 'news'
    queryset = model.objects.published()

#    def get_queryset(self):
#        from django.db.models import Q
#        query = self.queryset.published()
#
#        date = self.request.GET.get('date', None)
#        if date:
#            date = date.split('.')
#            query = query.filter(
#                Q(date_add__year = date[2])&
#                Q(date_add__month = date[1])&
#                Q(date_add__day = date[0])
#            )
#        return query

    def get_context_data(self, **kwargs):
        context = super(NewsListView, self).get_context_data(**kwargs)
        context['current_date'] = self.request.GET.get('date', None)
        return context

news_list = NewsListView.as_view()

class NewsDetailView(DetailView):
    context_object_name = 'news_current'
    model = News
    queryset = model.objects.published()

    def get_object(self, queryset=None):
        queryset = self.get_queryset()
        pk = self.kwargs.get('pk', None)
        try:
            obj = queryset.get(pk=pk)
        except ObjectDoesNotExist:
            return False
        return obj

    def get(self, request, **kwargs):
        self.object = self.get_object()
        if not self.object:
            return HttpResponseRedirect(reverse('news_list'))
        context = self.get_context_data(object=self.object)
        return self.render_to_response(context)

news_detail = NewsDetailView.as_view()

class LatestNewsFeed(Feed):
    title = u'Новости'
    link = '/news/'
    description = ''

    def items(self):
        return News.objects.published()[:50]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.short_text

def isodd(num):
    return num & 1 and True or False

class LoadNewsView(View):
    def post(self, request, *args, **kwargs):
        if not request.is_ajax():
            return HttpResponseRedirect('/')
        else:
            if 'already_loaded' not in request.POST:
                return HttpResponseBadRequest()

            already_loaded = request.POST['already_loaded']
            try:
                already_loaded = int(already_loaded)
            except ValueError:
                return HttpResponseBadRequest()

            count = 1

            if already_loaded:
              is_odd = isodd(already_loaded)
            else:
              is_odd = False

            endrange = already_loaded + count

            try:
                queryset = News.objects.published()
            except:
                return HttpResponseBadRequest()

            remaining_count = queryset.count() - endrange
            queryset = queryset[already_loaded:endrange]
            if count < remaining_count:
                remaining_count = False

            response = HttpResponse()
            items_html = render_to_string(
                'items_loader/new2_load_template.html',
                    {'items': queryset, 'endrange': endrange, 'is_odd': is_odd,
                     'remaining_count': remaining_count, }
            )
            response.content = items_html
            return response

load_items_news_about = LoadNewsView.as_view()

