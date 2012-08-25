# -*- coding: utf-8 -*-
from decimal import Decimal
import os, md5
from datetime import datetime, date, timedelta
from django.http import Http404, HttpResponse, HttpResponseBadRequest, HttpResponseRedirect, HttpResponseForbidden
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Max, Min, Count
from apps.siteblocks.models import Settings
from apps.newsboard.models import News
from django.views.generic import ListView, DetailView, DetailView, TemplateView, View

from models import Operator, ModemType, Point, SpeedAtPoint, City, Distinct, Ability, convert_parameter
from batch_select.models import BatchManager

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

            distincts_by_pts = Point.objects.filter(distinct__city__id=curr_city.id).values(
                'distinct').distinct().order_by('distinct')
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

            if type not in ['avg', 'max', 'count']:
                return HttpResponseBadRequest()

            if type == 'count':
                curr_city_pts_count = curr_city.get_pts_count()
                html = render_to_string(
                    'workpoint/pt_count_block_template.html',
                        {
                        'curr_city': curr_city,
                        'count': curr_city_pts_count
                    })
                return HttpResponse(html)
            elif type == 'avg':
                operators = Operator.objects.published()
                max_avg = 0
                for operator in operators:
                    avg_value = curr_city.get_city_speed('avg', operator)
                    if max_avg < avg_value:
                        max_avg = avg_value
                        id_avg = operator.id
                    setattr(operator, 'curr_city_avg_speed', round(avg_value, 1))
                for operator in operators:
                    if operator.id == id_avg:
                        setattr(operator, 'max_avg', True)
                        avg_mult = 140 / operator.curr_city_avg_speed
                for operator in operators:
                    if operator.id != id_avg:
                        setattr(operator, 'curr_city_avg_speed_pos', avg_mult * operator.curr_city_avg_speed)
                html = render_to_string(
                    'workpoint/avg_speed_block_template.html',
                        {
                        'operators': operators
                    })
                return HttpResponse(html)
            elif type == 'max':
                operators = Operator.objects.published()
                max_max = 0
                for operator in operators:
                    max_value = curr_city.get_city_speed('max', operator)
                    if max_max < max_value:
                        max_max = max_value
                        id_max = operator.id
                    setattr(operator, 'curr_city_max_speed', round(max_value, 1))
                for operator in operators:
                    if operator.id == id_max:
                        setattr(operator, 'max_max', True)
                        max_mult = 140 / operator.curr_city_max_speed
                for operator in operators:
                    if operator.id != id_max:
                        setattr(operator, 'curr_city_max_speed_pos', max_mult * operator.curr_city_max_speed)
                html = render_to_string(
                    'workpoint/max_speed_block_template.html',
                        {
                        'operators': operators
                    })
                return HttpResponse(html)
            else:
                return HttpResponse('')
        else:
            return HttpResponseBadRequest()

load_stat_city_div = LoadCityStatDivs.as_view()

class LoadBalloonContent(View):
    def get(self, request, *args, **kwargs):
        if request.is_ajax():
            id_point = request.GET.get('id_point', None)
            op_title = request.GET.get('op_title', None)

            try:
                id_point = int(id_point)
            except ValueError:
                return HttpResponseBadRequest()

            try:
                operator = Operator.objects.get(title=op_title)
            except:
                operator = False

            try:
                curr_point = Point.objects.filter(id=id_point).batch_select('speedatpoint')
                curr_point = curr_point[0]
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
            if 'id_point' not in request.POST or 'op_title' not in request.POST or 'mdm_type' not in request.POST or 'min' not in request.POST or 'max' not in request.POST:
                return HttpResponseBadRequest()

            id_point = request.POST['id_point']
            op_title = request.POST['op_title']
            mdm_type = request.POST['mdm_type']
            mdm_type = mdm_type.replace(',', '.')
            minMBs = request.POST['min']
            maxMBs = request.POST['max']

            try:
                id_point = int(id_point)
            except ValueError:
                return HttpResponseBadRequest()

            try:
                curr_point = Point.objects.get(id=id_point)
            except Operator.DoesNotExist:
                return HttpResponseBadRequest()

            if minMBs=='false' or maxMBs=='false':
                is_interval = 'yes'
            else:
                checked_abilities_set = Ability.objects.filter(download_speed__gte=Decimal("%s" % minMBs),download_speed__lte=Decimal("%s" % maxMBs))

                if op_title in [u'Оператор',u'Все'] and mdm_type == u'Тип модема':
                    point_abilities = curr_point.get_abilities().latest()
                    filtered_set = checked_abilities_set.filter(id=point_abilities.id)
                    if filtered_set:
                        is_interval = 'yes'
                    else:
                        is_interval = 'no'
                else:
                    point_abilities = curr_point.get_abilities_additional(op_title, mdm_type).latest()
                    filtered_set = checked_abilities_set.filter(id=point_abilities.id)
                    if filtered_set:
                        is_interval = 'yes'
                    else:
                        is_interval = 'no'

            html_content = curr_point.get_abilitiy_icon_additional(op_title, mdm_type)
            data = u'''{"url":'%s',"is_in_interval":'%s'}''' % (html_content, is_interval)
            return HttpResponse(data)
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
            try:
                city_id = self.request.GET['city']
                city_id = int(city_id)
                city_curr = cities.get(id=city_id)
            except:
                city_id = False
            if not city_id:
                try:
                    stat_curr_city_id = Settings.objects.get(name='stat_curr_city_id').value
                    city_curr = cities.get(id=stat_curr_city_id)
                except:
                    city_curr = cities[0]
            context['cities'] = cities.exclude(id=city_curr.id)
            context['city_curr'] = city_curr
        except:
            context['cities'] = False
            city_curr = False
        if city_curr:
            distincts_by_pts = Point.objects.filter(distinct__city__id=city_curr.id).values(
                'distinct').distinct().order_by('distinct')
            id_distincts = []
            for id in distincts_by_pts:
                id_distincts.append(id['distinct'])
            distincts_set = Distinct.objects.published().filter(id__in=id_distincts)
            context['distincts'] = distincts_set[
                                   :20] # todo: не забыть убрать - ограничение на вывод районов на странице статистики
            if distincts_by_pts:
                operators = Operator.objects.published()
                context['operators'] = operators
                max_avg = 0
                max_max = 0
                city_mtypes = city_curr.get_mtypes()
                city_mtypes_max_val_set = []
                for item in city_mtypes:
                    city_mtypes_max_val_set.append({'type': '%s' % item['download_speed'], 'value': 0})
                for operator in operators:
                    avg_value = city_curr.get_city_speed('avg', operator)
                    max_value = city_curr.get_city_speed('max', operator)
                    if max_avg < avg_value:
                        max_avg = avg_value
                        id_avg = operator.id
                    if max_max < max_value:
                        max_max = max_value
                        id_max = operator.id
                    setattr(operator, 'curr_city_avg_speed', round(avg_value, 1))
                    setattr(operator, 'curr_city_max_speed', round(max_value, 1))
                    tmodems_set = ModemType.objects.filter(operator__id=operator.id)
                    tmodems_set = tmodems_set.values('download_speed').distinct().order_by('download_speed')
                    max_avg_mtype = 0
                    max_avg_mtype_set = []
                    
                    for mtype in city_mtypes:
                        mtype_avg_value = city_curr.get_city_speed('avg', operator, mtype['download_speed'])
                        for item in city_mtypes_max_val_set:
                            if item['type'] == '%s' % mtype['download_speed']:
                                if item['value'] < mtype_avg_value:
                                    item['value'] = round(mtype_avg_value, 1)

                        if max_avg_mtype < mtype_avg_value:
                            max_avg_mtype = mtype_avg_value
                            id_avg_mtype = mtype['download_speed']
                        max_avg_mtype_set.append(
                                {'id_mtype': mtype['download_speed'], 'mtype_avg_value': round(mtype_avg_value, 1),
                                 'max_avg_mtype': False, 'avg_pos': 0})
                    for item in max_avg_mtype_set:
                        if item['id_mtype'] == id_avg_mtype:
                            item['max_avg_mtype'] = True
                            avg_mtype_mult = 118 / item['mtype_avg_value']
                    for item in max_avg_mtype_set:
                        if item['id_mtype'] != id_avg_mtype:
                            item['avg_pos'] = avg_mtype_mult * item['mtype_avg_value']
                    
                    setattr(operator, 'mtype_avg_set', max_avg_mtype_set)

                for operator in operators:
                    if operator.id == id_avg:
                        setattr(operator, 'max_avg', True)
                        avg_mult = 140 / operator.curr_city_avg_speed
                    if operator.id == id_max:
                        setattr(operator, 'max_max', True)
                        max_mult = 140 / operator.curr_city_max_speed
#                for operator in operators: # - кажись не используется :)
#                    if operator.id != id_avg:
#                        setattr(operator, 'curr_city_avg_speed_pos', avg_mult * operator.curr_city_avg_speed)
#                    if operator.id != id_max:
#  :)                    setattr(operator, 'curr_city_max_speed_pos', max_mult * operator.curr_city_max_speed)

                context['city_mtypes_max_val_set'] = city_mtypes_max_val_set

                # найдем среднюю скорость по текущему городу
                curr_city_avg_speed = city_curr.get_city_speed('avg')
                curr_city_avg_speed = round(curr_city_avg_speed, 1)
                curr_city_avg_speed = str(curr_city_avg_speed).replace(',', '.')
                context['curr_city_avg_speed'] = curr_city_avg_speed

                # количества по интервалам
                # массив с интервалами
                interval_array_values = []
                interval_array = []
                counter = 0
                next = 0
                while next != 2.5:
                    next = counter + 0.5
                    interval_array.append({'min': counter, 'max': next, 'pts_count_op': [], 'pts_count_city': 0})
                    counter = next
                for item in interval_array:
                    for operator in operators:
                        pts_count_op = city_curr.get_pts_count(operator, item['min'], item['max'])
                        item['pts_count_op'].append(pts_count_op)
                    pts_count_city = city_curr.get_pts_count(False, item['min'], item['max'])
                    item['pts_count_city'] = pts_count_city
                context['interval_array'] = interval_array
        return context

statistic_page = StatisticView.as_view()

class LoadCityStatistics(View):
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
                city_curr = City.objects.published().get(id=id_city)
            except City.DoesNotExist:
                return HttpResponseBadRequest()


            if 'id_distinct' in request.POST:
                id_distinct = request.POST['id_distinct']
            else:
                id_distinct = False

            if id_distinct:
                try:
                    id_distinct = int(id_distinct)
                    try:
                        curr_distinct = Distinct.objects.published().get(id=id_distinct)
                    except Distinct.DoesNotExist:
                        return HttpResponseBadRequest()
                    operators = Operator.objects.published()
                    max_avg = 0
                    max_max = 0
                    id_max = None
                    id_avg = None
                    city_mtypes = curr_distinct.get_mtypes()
                    if not city_mtypes:
                        return HttpResponseBadRequest()
                    city_mtypes_max_val_set = []
                    for item in city_mtypes:
                        city_mtypes_max_val_set.append({'type': '%s' % item['download_speed'], 'value': 0})
                    for operator in operators:
                        avg_value = curr_distinct.get_distinct_speed('avg', operator)
                        max_value = curr_distinct.get_distinct_speed('max', operator)
                        if max_avg < avg_value:
                            max_avg = avg_value
                            id_avg = operator.id
                        if max_max < max_value:
                            max_max = max_value
                            id_max = operator.id
                        setattr(operator, 'curr_city_avg_speed', round(avg_value, 1))
                        setattr(operator, 'curr_city_max_speed', round(max_value, 1))
                        tmodems_set = ModemType.objects.filter(operator__id=operator.id)
                        tmodems_set = tmodems_set.values('download_speed').distinct().order_by('download_speed')
                        max_avg_mtype = 0
                        max_avg_mtype_set = []
                        id_avg_mtype = None
                        #for mtype in tmodems_set:
                        for mtype in city_mtypes:
                            mtype_avg_value = curr_distinct.get_distinct_speed('avg', operator, mtype['download_speed'])
                            for item in city_mtypes_max_val_set:
                                if item['type'] == '%s' % mtype['download_speed']:
                                    if item['value'] < mtype_avg_value:
                                        item['value'] = round(mtype_avg_value, 1)

                            if max_avg_mtype < mtype_avg_value:
                                max_avg_mtype = mtype_avg_value
                                id_avg_mtype = mtype['download_speed']
                            max_avg_mtype_set.append(
                                    {'id_mtype': mtype['download_speed'], 'mtype_avg_value': round(mtype_avg_value, 1),
                                     'max_avg_mtype': False, 'avg_pos': 0})
                        for item in max_avg_mtype_set:
                            if item['id_mtype'] == id_avg_mtype:
                                item['max_avg_mtype'] = True
                                try:
                                    avg_mtype_mult = 118 / item['mtype_avg_value']
                                except:
                                    avg_mtype_mult = 118 / 1
                        for item in max_avg_mtype_set:
                            if item['id_mtype'] != id_avg_mtype and id_avg_mtype != None:
                                item['avg_pos'] = avg_mtype_mult * item['mtype_avg_value']
                        setattr(operator, 'mtype_avg_set', max_avg_mtype_set)

                    for operator in operators:
                        if operator.id == id_avg:
                            setattr(operator, 'max_avg', True)
                            avg_mult = 140 / operator.curr_city_avg_speed
                        if operator.id == id_max:
                            setattr(operator, 'max_max', True)
                            max_mult = 140 / operator.curr_city_max_speed
                    for operator in operators:
                        if operator.id != id_avg and id_avg != None:
                            setattr(operator, 'curr_city_avg_speed_pos', avg_mult * operator.curr_city_avg_speed)
                        if operator.id != id_max and id_max != None:
                            setattr(operator, 'curr_city_max_speed_pos', max_mult * operator.curr_city_max_speed)

                    # количества по интервалам
                    # массив с интервалами
                    interval_array_values = []
                    interval_array = []
                    counter = 0
                    next = 0
                    while next != 2.5:
                        next = counter + 0.5
                        interval_array.append({'min': counter, 'max': next, 'pts_count_op': [], 'pts_count_city': 0})
                        counter = next
                    for item in interval_array:
                        for operator in operators:
                            pts_count_op = curr_distinct.get_pts_count(operator, item['min'], item['max'])
                            item['pts_count_op'].append(pts_count_op)
                        pts_count_city = curr_distinct.get_pts_count(False, item['min'], item['max'])
                        item['pts_count_city'] = pts_count_city

                    html = render_to_string(
                        'workpoint/stats_block.html',
                            {
                            'city_curr': city_curr,
                            'operators': operators,
                            'interval_array': interval_array,
                            'city_mtypes_max_val_set': city_mtypes_max_val_set
                        })
                    return HttpResponse(html)
                except ValueError:
                    if id_distinct == 'all':
                        pass
                    else:
                        return HttpResponseBadRequest()

            operators = Operator.objects.published()
            max_avg = 0
            max_max = 0
            id_max = None
            id_avg = None
            city_mtypes = city_curr.get_mtypes()
            if not city_mtypes:
                return HttpResponseBadRequest()
            city_mtypes_max_val_set = []
            for item in city_mtypes:
                city_mtypes_max_val_set.append({'type': '%s' % item['download_speed'], 'value': 0})
            for operator in operators:
                avg_value = city_curr.get_city_speed('avg', operator)
                max_value = city_curr.get_city_speed('max', operator)
                if max_avg < avg_value:
                    max_avg = avg_value
                    id_avg = operator.id
                if max_max < max_value:
                    max_max = max_value
                    id_max = operator.id
                setattr(operator, 'curr_city_avg_speed', round(avg_value, 1))
                setattr(operator, 'curr_city_max_speed', round(max_value, 1))
                tmodems_set = ModemType.objects.filter(operator__id=operator.id)
                tmodems_set = tmodems_set.values('download_speed').distinct().order_by('download_speed')
                max_avg_mtype = 0
                max_avg_mtype_set = []
                id_avg_mtype = None
                #for mtype in tmodems_set:
                for mtype in city_mtypes:
                    mtype_avg_value = city_curr.get_city_speed('avg', operator, mtype['download_speed'])
                    for item in city_mtypes_max_val_set:
                        if item['type'] == '%s' % mtype['download_speed']:
                            if item['value'] < mtype_avg_value:
                                item['value'] = round(mtype_avg_value, 1)

                    if max_avg_mtype < mtype_avg_value:
                        max_avg_mtype = mtype_avg_value
                        id_avg_mtype = mtype['download_speed']
                    max_avg_mtype_set.append(
                            {'id_mtype': mtype['download_speed'], 'mtype_avg_value': round(mtype_avg_value, 1),
                             'max_avg_mtype': False, 'avg_pos': 0})
                for item in max_avg_mtype_set:
                    if item['id_mtype'] == id_avg_mtype:
                        item['max_avg_mtype'] = True
                        avg_mtype_mult = 118 / item['mtype_avg_value']
                for item in max_avg_mtype_set:
                    if item['id_mtype'] != id_avg_mtype and id_avg_mtype != None:
                        item['avg_pos'] = avg_mtype_mult * item['mtype_avg_value']
                setattr(operator, 'mtype_avg_set', max_avg_mtype_set)

            for operator in operators:
                if operator.id == id_avg:
                    setattr(operator, 'max_avg', True)
                    avg_mult = 140 / operator.curr_city_avg_speed
                if operator.id == id_max:
                    setattr(operator, 'max_max', True)
                    max_mult = 140 / operator.curr_city_max_speed
            for operator in operators:
                if operator.id != id_avg and id_avg != None:
                    setattr(operator, 'curr_city_avg_speed_pos', avg_mult * operator.curr_city_avg_speed)
                if operator.id != id_max and id_max != None:
                    setattr(operator, 'curr_city_max_speed_pos', max_mult * operator.curr_city_max_speed)

            # количества по интервалам
            # массив с интервалами
            interval_array_values = []
            interval_array = []
            counter = 0
            next = 0
            while next != 2.5:
                next = counter + 0.5
                interval_array.append({'min': counter, 'max': next, 'pts_count_op': [], 'pts_count_city': 0})
                counter = next
            for item in interval_array:
                for operator in operators:
                    pts_count_op = city_curr.get_pts_count(operator, item['min'], item['max'])
                    item['pts_count_op'].append(pts_count_op)
                pts_count_city = city_curr.get_pts_count(False, item['min'], item['max'])
                item['pts_count_city'] = pts_count_city

            html = render_to_string(
                'workpoint/stats_block.html',
                    {
                    'city_curr': city_curr,
                    'operators': operators,
                    'interval_array': interval_array,
                    'city_mtypes_max_val_set': city_mtypes_max_val_set
                })
            return HttpResponse(html)
        else:
            return HttpResponseBadRequest()

load_city_stat = LoadCityStatistics.as_view()

class LoadCityAvgSpeed(View):
    def post(self, request, *args, **kwargs):
        if request.is_ajax():
            if 'id_city' not in request.POST:
                return HttpResponseBadRequest()

            if 'id_distinct' in request.POST:
                id_distinct = request.POST['id_distinct']
            else:
                id_distinct = False

            if id_distinct:
                try:
                    id_distinct = int(id_distinct)
                    try:
                        curr_distinct = Distinct.objects.published().get(id=id_distinct)
                    except Distinct.DoesNotExist:
                        return HttpResponseBadRequest()
                        # найдем среднюю скорость по текущему району
                    curr_distinct_avg_speed = curr_distinct.get_distinct_speed('avg')
                    curr_distinct_avg_speed = round(curr_distinct_avg_speed, 1)
                    curr_distinct_avg_speed = str(curr_distinct_avg_speed).replace(',', '.')

                    html = render_to_string(
                        'workpoint/avg_block.html',
                            {
                            'type': 'району',
                            'curr_city_avg_speed': curr_distinct_avg_speed
                        })
                    return HttpResponse(html)
                except ValueError:
                    if id_distinct == 'all':
                        pass
                    else:
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
                # найдем среднюю скорость по текущему городу
            curr_city_avg_speed = curr_city.get_city_speed('avg')
            curr_city_avg_speed = round(curr_city_avg_speed, 1)
            curr_city_avg_speed = str(curr_city_avg_speed).replace(',', '.')

            html = render_to_string(
                'workpoint/avg_block.html',
                    {
                    'type': 'городу',
                    'curr_city_avg_speed': curr_city_avg_speed
                })
            return HttpResponse(html)
        else:
            return HttpResponseBadRequest()

load_city_avg_speed = LoadCityAvgSpeed.as_view()