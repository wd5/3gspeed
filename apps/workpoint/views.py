# -*- coding: utf-8 -*-
import os, md5
from datetime import datetime, date, timedelta
from django.http import Http404, HttpResponse, HttpResponseBadRequest, HttpResponseRedirect, HttpResponseForbidden
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Max, Min, Count
from apps.siteblocks.models import Settings
from apps.newsboard.models import News
from django.views.generic import ListView, DetailView, DetailView, TemplateView, View

from models import Operator, ModemType, Point, SpeedAtPoint, City, Distinct


class LoadMTypesAdmin(View):
    def post(self, request, *args, **kwargs):
        if request.is_ajax():
            if 'id_operator' not in request.POST:
                return HttpResponseBadRequest()

            id_operator = request.POST['id_operator']

            try:
                id_operator = int(id_operator)
            except ValueError:
                return HttpResponseBadRequest()

            try:
                curr_operator = Operator.objects.published().get(id=id_operator)
            except Operator.DoesNotExist:
                return HttpResponseBadRequest()

            types = curr_operator.get_modem_types()
            html_code = u'<option value="" selected="selected">---------</option>'
            for type in types:
                html_code = u'%s<option value="%s">%s - %s - %s</option>' % (
                    html_code, type.id, type.vendor, type.model, type.download_speed)
            return HttpResponse(html_code)
        else:
            return HttpResponseBadRequest(u'<option value="" selected="selected">---------</option>')

load_modem_types = LoadMTypesAdmin.as_view()

class LoadBalloonContent(View):
    def post(self, request, *args, **kwargs):
        if request.is_ajax():
            if 'id_point' not in request.POST or 'op_title' not in request.POST:
                return HttpResponseBadRequest()

            id_point = request.POST['id_point']
            op_title = request.POST['op_title']

            try:
                id_point = int(id_point)
            except ValueError:
                return HttpResponseBadRequest()

            try:
                operator = Operator.objects.published().get(title=op_title)
            except:
                operator = False

            try:
                curr_point = Point.objects.get(id=id_point)
            except Operator.DoesNotExist:
                return HttpResponseBadRequest()

            html_content = curr_point.get_popup_window(operator)
            return HttpResponse(html_content)
        else:
            return HttpResponseBadRequest(u'')

load_balloon_content = LoadBalloonContent.as_view()

class LoadPointMarker(View):
    def post(self, request, *args, **kwargs):
        if request.is_ajax():
            if 'id_point' not in request.POST or 'op_title' not in request.POST or 'mdm_type' not in request.POST:
                return HttpResponseBadRequest()

            id_point = request.POST['id_point']
            op_title = request.POST['op_title']
            mdm_type = request.POST['mdm_type']
            mdm_type = mdm_type.replace(',', '.')

            try:
                id_point = int(id_point)
            except ValueError:
                return HttpResponseBadRequest()

            try:
                curr_point = Point.objects.get(id=id_point)
            except Operator.DoesNotExist:
                return HttpResponseBadRequest()

            html_content = curr_point.get_abilitiy_icon_additional(op_title, mdm_type)
            return HttpResponse(html_content)
        else:
            return HttpResponseBadRequest(u'')

load_point_marker = LoadPointMarker.as_view()

class AboutView(TemplateView):
    template_name = 'workpoint/about.html'

    def get_context_data(self, **kwargs):
        context = super(AboutView, self).get_context_data(**kwargs)
        try:
            context['about_text'] = Settings.objects.get(name='about_project').value
        except:
            context['about_text'] = ''
        try:
            context['about_car'] = Settings.objects.get(name='about_car').value
        except:
            context['about_car'] = ''
        news = News.objects.published()[:5]
        context['news'] = news
        #if news.count()>5:
        #   context['news']
        return context

about_page = AboutView.as_view()

class StatisticView(TemplateView):
    template_name = 'workpoint/statistic.html'

    def get_context_data(self, **kwargs):
        context = super(StatisticView, self).get_context_data(**kwargs)
        cities = City.objects.published()
        try:
            city_curr = cities[0]
            context['cities'] = cities.exclude(id=city_curr.id)
            context['city_curr'] = city_curr
        except:
            context['cities'] = False
            city_curr = False
        if city_curr:
            distincts_by_pts = Point.objects.filter(distinct__city__id=city_curr.id).values('distinct').distinct().order_by('distinct')
            id_distincts = []
            for id in distincts_by_pts:
                id_distincts.append(id['distinct'])
            distincts_set = Distinct.objects.published().filter(id__in=id_distincts)
            context['distincts'] = distincts_set[:20]

        # найдем среднюю скорость по текущему городу
        curr_city_avg_speed = city_curr.get_city_speed('avg')
        curr_city_avg_speed = round(curr_city_avg_speed, 1)
        curr_city_avg_speed = str(curr_city_avg_speed).replace(',', '.')
        context['curr_city_avg_speed'] = curr_city_avg_speed
        return context

statistic_page = StatisticView.as_view()


