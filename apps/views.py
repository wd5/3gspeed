# -*- coding: utf-8 -*-
import json
from django import http
from django.db.models.aggregates import Avg
from django.template.loader import render_to_string
from django.views.generic import TemplateView, DetailView, View
from apps.siteblocks.models import Settings
from apps.newsboard.models import News
from apps.workpoint.models import Operator, Point, Ability, SpeedAtPoint, City, Distinct, ModemType, MobileInternetSpeed, str_price


class IndexView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        try:
            context['about_text'] = Settings.objects.get(name='about_project').value
        except:
            context['about_text'] = ''
        context['news'] = News.objects.all()[:3]
        cities = City.objects.published()
        context['search'] = city_id = self.request.GET.get('search', '')
        try:
            try:
                try:
                    city_id = self.request.GET['city_id']
                    city_id = int(city_id)
                    city_curr = cities.get(id=city_id)
                except:
                    city_id = False
                if not city_id:
                    try:
                        map_curr_city_id = Settings.objects.get(name='map_curr_city_id').value
                        city_curr = cities.get(id=map_curr_city_id)
                    except:
                        city_curr = cities[0]
            except:
                city_curr = cities[0]
            context['cities'] = cities.exclude(id=city_curr.id)
            context['city_curr'] = city_curr
        except:
            context['cities'] = False
            city_curr = False

        operators = Operator.objects.published()

        mtype_ids = False
        if city_curr:
            context['curr_city_pts_count'] = city_curr.get_pts_count()
            max_avg = 0
            max_max = 0
            id_avg = None
            id_max = None
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

            mtype_ids = list()
            city_speedatpts = SpeedAtPoint.objects.filter(point__distinct__city__id=city_curr.id).values('modem_type__id').annotate()
            for item in city_speedatpts:
                mtype_ids.append(item['modem_type__id'])



        try:
            op_id = self.request.GET['op_id']
            op_id = int(op_id)
            op_curr = operators.get(id=op_id)
            context['op_curr'] = op_curr
        except:
            context['op_curr'] = False
        context['operators'] = operators
        if mtype_ids:
            mtypes = ModemType.objects.filter(id__in=mtype_ids).values('download_speed').distinct().order_by('download_speed')
            context['mtypes'] = mtypes
        abilities = Ability.objects.all()
        context['abilities'] = abilities
        return context

index = IndexView.as_view()


class PointsListJSON(View):
    def get(self, request):
        context = dict()

        try:
            city_id = int(self.request.GET.get('city_id'))
            city_curr = City.objects.get(id=city_id)
        except:
            city_id = False
            if not city_id:
                try:
                    map_curr_city_id = Settings.objects.get(name='map_curr_city_id').value
                    city_curr = City.objects.get(id=map_curr_city_id)
                except:
                    pass

        context['points'] = list()
        
        points = city_curr.get_points()

        for point in points:
            point_json = dict()
            
            point_json['id'] = point.id
            point_json['coord'] = point.coord 

            point.speed_values = point.speedatpoint_all
            point_json['operators'] = point.get_operators_ids()

            context['points'].append(point_json)
            
        context['city_id'] = city_curr.id

        abilities = Ability.objects.all()
        context['abilities'] = list()
        for item in abilities:
            ab_json = dict()
            ab_json['id'] = item.id
            ab_json['icon'] = item.icon.url
            ab_json['marker'] = item.marker.url
            ab_json['title'] = item.title
            ab_json['speed'] = round(float(item.download_speed), 1)
            context['abilities'].append(ab_json)

        operators = Operator.objects.all()
        context['operators'] = list()
        for item in operators:
            op_json = dict()
            op_json['id'] = item.id
            op_json['title'] = item.title
            context['operators'].append(op_json)

        modem_types = city_curr.get_mtypes_2()
        context['modem_types'] = list()
        for item in modem_types:
            ab_json = dict()
            ab_json['id'] = item.id
            ab_json['operator'] = item.operator_id
            ab_json['vendor'] = item.vendor
            ab_json['model'] = item.model
            ab_json['download_speed'] = round(float(item.download_speed), 1)
            context['modem_types'].append(ab_json)

        json_data = json.dumps(context, encoding='utf-8')
        
        return http.HttpResponse(json_data, content_type='application/json')  

points_list_json = PointsListJSON.as_view()

class PointsListJSONTest(View):
    def get(self, request):
        context = dict()

        try:
            city_id = int(self.request.GET.get('city_id'))
            city_curr = City.objects.get(id=city_id)
        except:
            city_id = False
            if not city_id:
                try:
                    map_curr_city_id = Settings.objects.get(name='map_curr_city_id').value
                    city_curr = City.objects.get(id=map_curr_city_id)
                except:
                    pass

        context['points'] = list()
        
        points = city_curr.get_points()

        for point in points:
            point_json = dict()
            
            point_json['id'] = point.id
            point_json['coord'] = point.coord 

            context['points'].append(point_json)
            
        context['city_id'] = city_curr.id

        json_data = json.dumps(context, encoding='utf-8')
        
        return http.HttpResponse(json_data, content_type='application/json')  

points_list_json_test = PointsListJSONTest.as_view()

class IndexViewTest(TemplateView):
    template_name = 'test.html'

    def get_context_data(self, **kwargs):
        context = super(IndexViewTest, self).get_context_data(**kwargs)

        cities = City.objects.published()
        try:
            try:
                try:
                    city_id = self.request.GET['city_id']
                    city_id = int(city_id)
                    city_curr = cities.get(id=city_id)
                except:
                    city_id = False
                if not city_id:
                    try:
                        map_curr_city_id = Settings.objects.get(name='map_curr_city_id').value
                        city_curr = cities.get(id=map_curr_city_id)
                    except:
                        city_curr = cities[0]
            except:
                city_curr = cities[0]
            context['cities'] = cities.exclude(id=city_curr.id)
            context['city_curr'] = city_curr
        except:
            context['cities'] = False
            city_curr = False
        if city_curr:
            #context['points'] = city_curr.get_points()
            context['curr_city_pts_count'] = city_curr.get_pts_count()
        operators = Operator.objects.published()

        return context

test = IndexViewTest.as_view()


class DBCopyView(TemplateView):
    template_name = 'res.html'

    def get_context_data(self, **kwargs):
        context = super(DBCopyView, self).get_context_data(**kwargs)

        not_distincts = []
        same_coord = []
        rows = MobileInternetSpeed.objects.all()

        routes = MobileInternetSpeed.objects.values('Route').distinct().order_by('Route')
        curr_city = City.objects.get(id=1)
        for route in routes:
            title = route['Route']
            if title==None:
                pass
            else:
                exits = Distinct.objects.filter(title=title)
                if not exits:
                    new_distinct = Distinct(city=curr_city, title=title)
                    new_distinct.save()

        for row in rows:
            try:
                distinct = Distinct.objects.get(title=row.Route)
            except:

                ###
                not_distincts.append(row.currentMoment)
                ###

                distinct = False
            coords = u'%s,%s' % (row.Latitude, row.Longitude)
            if distinct:
                try:
                    point = Point.objects.get(coord=coords)
                except:
                    point = False
                if point:

                    ###
                    list = []
                    list.append(row.currentMoment)
                    list.append(row.Latitude)
                    list.append(row.Longitude)
                    list.append(point.datetime_create)
                    same_coord.append(list)
                    ###

                    new_point = point
                    '''speed_values = point.get_speed_values()
                    for value in speed_values:
                        if value.modem_type_id==row.megafonModemTypeId:
                            if value.internet_speed < row.megafonDownloadSpeed:
                                value.internet_speed = row.megafonDownloadSpeed
                                value.save()
                        if value.modem_type_id==row.mtsModemTypeId:
                            if value.internet_speed < row.mtsDownloadSpeed:
                                value.internet_speed = row.mtsDownloadSpeed
                                value.save()
                        if value.modem_type_id==row.beelineModemTypeId:
                            if value.internet_speed < row.beelineDownloadSpeed:
                                value.internet_speed = row.beelineDownloadSpeed
                                value.save()'''
                else:
                    new_point = Point(distinct=distinct, coord=coords, datetime_create=row.currentMoment)
                    new_point.save()
                megafon_mtype = ModemType.objects.get(id=row.megafonModemTypeId)
                megafon_mtype_operator = megafon_mtype.operator
                mts_mtype = ModemType.objects.get(id=row.mtsModemTypeId)
                mts_mtype_operator = mts_mtype.operator
                beeline_mtype = ModemType.objects.get(id=row.beelineModemTypeId)
                beeline_mtype_operator = beeline_mtype.operator

                new_pt_spd_meg = SpeedAtPoint(point=new_point, operator=megafon_mtype_operator, modem_type=megafon_mtype, internet_speed=row.megafonDownloadSpeed )
                new_pt_spd_mts = SpeedAtPoint(point=new_point, operator=mts_mtype_operator, modem_type=mts_mtype, internet_speed=row.mtsDownloadSpeed )
                new_pt_spd_beel = SpeedAtPoint(point=new_point, operator=beeline_mtype_operator, modem_type=beeline_mtype, internet_speed=row.beelineDownloadSpeed )
                new_pt_spd_meg.save()
                new_pt_spd_mts.save()
                new_pt_spd_beel.save()

        context['result'] = rows.count
        context['nondist'] = not_distincts
        context['samecoord'] = same_coord

        # примерное расстояние в 50 метров в координатах 0.0008982 - по долготе
        # примерное расстояние в 100 метров в координатах 0.0008982 - по широте - сделовательно примерную окружность с радиусом 50 м нужно строить в виде эллипса - потому что в виду географических проекций и формы земли - построенная окружность превратится в эллпис

#        points = Point.objects.all().order_by('distinct')
#        R = 0.0008982 * 2
#        for curr_point in points:
#            setattr(curr_point, 'is_delete', False)
#
#        for curr_point in points:
#            if curr_point.is_delete != True:
#                curr_point_speed_values = curr_point.get_speed_values()
#                for curr_value in curr_point_speed_values:
#                    setattr(curr_value, 'avg_set', [curr_value.internet_speed, ])
#                curr_point_coord = curr_point.coord.split(',')
#                curr_point_coord = [float(curr_point_coord[0]), float(curr_point_coord[1])]
#                for point in points:
#                    if point.id != curr_point.id:
#                        next_point_coord = point.coord.split(',')
#                        next_point_coord = [float(next_point_coord[0]), float(next_point_coord[1])]
#                        #circle = (next_point_coord[0] - curr_point_coord[0])**2 + (next_point_coord[1] - curr_point_coord[1])**2
#                        ellipse = ((next_point_coord[0] - curr_point_coord[0]) ** 2 / ((R / 2) ** 2)) + ((next_point_coord[1] - curr_point_coord[1]) ** 2 / (R ** 2))
#                        #if circle <= R**2:
#                        if ellipse <= 1:
#                            speed_values = point.get_speed_values()
#                            for curr_value in curr_point_speed_values:
#                                for value in speed_values:
#                                    value.point = curr_point
#                                    value.save()
#                                    '''if value.modem_type_id == curr_value.modem_type_id: # если типы модемов для точек равны - в усреднение
#                                        curr_value.avg_set.append(value.internet_speed)
#                                        #curr_value.internet_speed = (curr_value.internet_speed + value.internet_speed) / 2
#                                        #curr_value.save()
#                                    else: # если не равны то к текущей точке добавляем данные о замере скорости
#                                        new_measuring_data = SpeedAtPoint(point=curr_point, operator=value.operator, modem_type=value.modem_type, internet_speed=value.internet_speed)
#                                        new_measuring_data.save()'''
#                            setattr(point, 'is_delete', True)
#                        else:
#                            pass
#                    # найдём среднюю скорость, и сохраним
#                '''for curr_value in curr_point_speed_values:
#                    summ = 0
#                    counter = 0
#                    for val in curr_value.avg_set:
#                        summ = summ + val
#                        counter = counter + 1
#                    curr_value.internet_speed = summ / counter
#                    curr_value.save()'''
#            else:
#                ex = 1
#
#        for point in points:
#            speed_values = point.get_speed_values()
#            if point.is_delete == True: # удаляем
#                for value in speed_values:
#                    value.delete()
#                point.delete()
#

        # усредним замеры по повторяющимся типам модемов
#        for curr_point in points:
#            curr_point_speed_values = curr_point.get_speed_values()
#            for curr_value in curr_point_speed_values:
#                setattr(curr_value, 'is_delete', False)
#            for curr_value in curr_point_speed_values:
#                setattr(curr_value, 'avg_set', [curr_value.internet_speed, ])
#            for curr_value in curr_point_speed_values:
#                if curr_value.is_delete != True:
#                    for value in curr_point_speed_values:
#                        if value.id != curr_value.id and curr_value.modem_type_id == value.modem_type_id:
#                            curr_value.avg_set.append(value.internet_speed)
#                            setattr(value, 'is_delete', True)
#
#            for curr_value in curr_point_speed_values:
#                summ = 0
#                counter = 0
#                for val in curr_value.avg_set:
#                    summ = summ + val
#                    counter = counter + 1
#                curr_value.internet_speed = summ / counter
#                curr_value.save()
#
#            for curr_value in curr_point_speed_values:
#                if curr_value.is_delete == True: # удаляем
#                    curr_value.delete()

        return context

db_copy = DBCopyView.as_view()



#class ShowPTLbl(DetailView):
#    slug_field = 'pk'
#    model = Point
#    template_name = 'ShowPTLbl.html'
#    context_object_name = 'point'
#
#    def get_context_data(self, **kwargs):
#        context = super(ShowPTLbl, self).get_context_data(**kwargs)
#        return context
#
#shop_point_label = ShowPTLbl.as_view()
