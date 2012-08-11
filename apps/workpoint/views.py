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

class LoadCityDistincts(View):
    def post(self, request, *args, **kwargs):
        if request.is_ajax():
            if 'id_city' not in request.POST:
                return HttpResponseBadRequest()

            id_city = request.POST['id_city']

            try:
                id_city = int(id_city)
            except ValueError:
                return HttpResponseBadRequest()

            try:
                curr_city = City.objects.published().get(id=id_city)
            except City.DoesNotExist:
                return HttpResponseBadRequest()

            distincts_by_pts = Point.objects.filter(distinct__city__id=curr_city.id).values('distinct').distinct().order_by('distinct')
            id_distincts = []
            for id in distincts_by_pts:
                id_distincts.append(id['distinct'])
            distincts_set = Distinct.objects.published().filter(id__in=id_distincts)
            html_code = u''
            for distinct in distincts_set:
                html_code = u'%s<li><a href="#" name="%s">%s</a></li>' % ( html_code, distinct.id, distinct.title[:30])
            return HttpResponse(html_code)
        else:
            return HttpResponseBadRequest()

load_city_distincts = LoadCityDistincts.as_view()

class LoadCityStatDivs(View):
    def post(self, request, *args, **kwargs):
        if request.is_ajax():
            if 'city_title' not in request.POST or 'type' not in request.POST:
                return HttpResponseBadRequest()

            city_title = request.POST['city_title']
            type = request.POST['type']

            try:
                curr_city = City.objects.published().get(title=city_title)
            except City.DoesNotExist:
                return HttpResponseBadRequest()

            if type not in ['avg','max','count']:
                return HttpResponseBadRequest()

            if type == 'count':
                curr_city_pts_count =  curr_city.get_pts_count()
                html = render_to_string(
                    'workpoint/pt_count_block_template.html',
                        {
                        'title':curr_city.title_second,
                        'count':curr_city_pts_count
                    })
                return HttpResponse(html)
            elif type == 'avg':
                operators = Operator.objects.published()
                max_avg = 0
                for operator in operators:
                    avg_value = curr_city.get_city_speed('avg',operator)
                    if max_avg < avg_value:
                        max_avg = avg_value
                        id_avg = operator.id
                    setattr(operator, 'curr_city_avg_speed', round(avg_value,1))
                for operator in operators:
                    if operator.id == id_avg:
                        setattr(operator, 'max_avg', True)
                        avg_mult = 140 / operator.curr_city_avg_speed
                for operator in operators:
                    if operator.id != id_avg:
                        setattr(operator, 'curr_city_avg_speed_pos', avg_mult*operator.curr_city_avg_speed)
                html = render_to_string(
                    'workpoint/avg_speed_block_template.html',
                        {
                        'operators':operators
                    })
                return HttpResponse(html)
            elif type == 'max':
                operators = Operator.objects.published()
                max_max = 0
                for operator in operators:
                    max_value = curr_city.get_city_speed('max',operator)
                    if max_max < max_value:
                        max_max = max_value
                        id_max = operator.id
                    setattr(operator, 'curr_city_max_speed', round(max_value,1))
                for operator in operators:
                    if operator.id == id_max:
                        setattr(operator, 'max_max', True)
                        max_mult = 140 / operator.curr_city_max_speed
                for operator in operators:
                    if operator.id != id_max:
                        setattr(operator, 'curr_city_max_speed_pos', max_mult*operator.curr_city_max_speed)
                html = render_to_string(
                    'workpoint/max_speed_block_template.html',
                        {
                        'operators':operators
                    })
                return HttpResponse(html)
            else:
                return HttpResponse('')
        else:
            return HttpResponseBadRequest()

load_stat_city_div = LoadCityStatDivs.as_view()

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

            operators = Operator.objects.published()
            context['operators'] = operators
            max_avg = 0
            max_max = 0
            max_types = 0
            city_mtypes = city_curr.get_mtypes()
            city_mtypes_max_val_set = []
            for item in city_mtypes:
                city_mtypes_max_val_set.append({'type':'%s' % item['download_speed'], 'value':0})
            for operator in operators:
                avg_value = city_curr.get_city_speed('avg',operator)
                max_value = city_curr.get_city_speed('max',operator)
                if max_avg < avg_value:
                    max_avg = avg_value
                    id_avg = operator.id
                if max_max < max_value:
                    max_max = max_value
                    id_max = operator.id
                setattr(operator, 'curr_city_avg_speed', round(avg_value,1))
                setattr(operator, 'curr_city_max_speed', round(max_value,1))
                tmodems_set = ModemType.objects.filter(operator__id=operator.id).values('download_speed').distinct().order_by('download_speed')
                max_avg_mtype = 0
                max_avg_mtype_set = []
                for mtype in tmodems_set:
                    mtype_avg_value = city_curr.get_city_speed('avg', operator, mtype['download_speed'])
                    for item in city_mtypes_max_val_set:
                        if item['type'] == '%s' % mtype['download_speed']:
                            if item['value'] < mtype_avg_value:
                                item['value'] = round(mtype_avg_value,1)

                    if max_avg_mtype < mtype_avg_value:
                        max_avg_mtype = mtype_avg_value
                        id_avg_mtype = mtype['download_speed']
                    max_avg_mtype_set.append({'id_mtype':mtype['download_speed'], 'mtype_avg_value':round(mtype_avg_value,1), 'max_avg_mtype':False, 'avg_pos':0})
                for item in max_avg_mtype_set:
                    if item['id_mtype'] == id_avg_mtype:
                        item['max_avg_mtype'] = True
                        avg_mtype_mult = 118 / item['mtype_avg_value']
                for item in max_avg_mtype_set:
                    if item['id_mtype'] != id_avg_mtype:
                        item['avg_pos'] = avg_mtype_mult*item['mtype_avg_value']
                setattr(operator, 'mtype_avg_set', max_avg_mtype_set)

            for operator in operators:
                if operator.id == id_avg:
                    setattr(operator, 'max_avg', True)
                    avg_mult = 140 / operator.curr_city_avg_speed
                if operator.id == id_max:
                    setattr(operator, 'max_max', True)
                    max_mult = 140 / operator.curr_city_max_speed
            for operator in operators:
                if operator.id != id_avg:
                    setattr(operator, 'curr_city_avg_speed_pos', avg_mult*operator.curr_city_avg_speed)
                if operator.id != id_max:
                    setattr(operator, 'curr_city_max_speed_pos', max_mult*operator.curr_city_max_speed)

            context['city_mtypes_max_val_set'] = city_mtypes_max_val_set

        # найдем среднюю скорость по текущему городу
        curr_city_avg_speed = city_curr.get_city_speed('avg')
        curr_city_avg_speed = round(curr_city_avg_speed, 1)
        curr_city_avg_speed = str(curr_city_avg_speed).replace(',', '.')
        context['curr_city_avg_speed'] = curr_city_avg_speed
        return context

statistic_page = StatisticView.as_view()


