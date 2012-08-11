# -*- coding: utf-8 -*-
from django.template.loader import render_to_string
from django.views.generic import TemplateView, DetailView
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
        context['news'] = News.objects.exclude(short_text='', text='')
        cities = City.objects.published()
        try:
            city_curr = cities[0]
            context['cities'] = cities.exclude(id=city_curr.id)
            context['city_curr'] = city_curr
        except:
            context['cities'] = False
            city_curr = False
        if city_curr:
            context['points'] = city_curr.get_points()
            context['curr_city_pts_count'] =  city_curr.get_pts_count()
        operators = Operator.objects.published()
        context['operators'] = operators
        if city_curr:
            max_avg = 0
            max_max = 0
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






        #        popup_html = render_to_string(
        #            'workpoint/point_popup.html',
        #                {})
        #        popup_html = popup_html.replace('\n', ' ')
        #        context['balloonLayout'] = popup_html

        mtypes = ModemType.objects.values('download_speed').distinct().order_by('download_speed')
        context['mtypes'] = mtypes
        abilities = Ability.objects.all()
        context['abilities'] = abilities
        return context

index = IndexView.as_view()

class DBCopyView(TemplateView):
    template_name = 'res.html'

    def get_context_data(self, **kwargs):
        context = super(DBCopyView, self).get_context_data(**kwargs)

        rows = MobileInternetSpeed.objects.all()
        # будут районы
        #        routes = MobileInternetSpeed.objects.values('Route').distinct().order_by('Route')
        #        curr_city = City.objects.get(id=1)
        #        for route in routes:
        #            title = route['Route']
        #            if title==None:
        #                pass
        #            else:
        #                exits = Distinct.objects.filter(title=title)
        #                if not exits:
        #                    new_distinct = Distinct(city=curr_city, title=title)
        #                    new_distinct.save()

#        for row in rows:
#            try:
#                distinct = Distinct.objects.get(title=row.Route)
#            except:
#                distinct = False
#            coords = u'%s,%s' % (row.Latitude, row.Longitude)
#            if distinct:
#                try:
#                    point = Point.objects.get(coord=coords)
#                except:
#                    point = False
#                if point:
#                    speed_values = point.get_speed_values()
#                    for value in speed_values:
#                        if value.modem_type_id==row.megafonModemTypeId:
#                            if value.internet_speed < row.megafonDownloadSpeed:
#                                value.internet_speed = row.megafonDownloadSpeed
#                                value.save()
#                        if value.modem_type_id==row.mtsModemTypeId:
#                            if value.internet_speed < row.mtsDownloadSpeed:
#                                value.internet_speed = row.mtsDownloadSpeed
#                                value.save()
#                        if value.modem_type_id==row.beelineModemTypeId:
#                            if value.internet_speed < row.beelineDownloadSpeed:
#                                value.internet_speed = row.beelineDownloadSpeed
#                                value.save()
#                else:
#                    new_point = Point(distinct=distinct, coord=coords, datetime_create=row.currentMoment)
#                    new_point.save()
#                    megafon_mtype = ModemType.objects.get(id=row.megafonModemTypeId)
#                    megafon_mtype_operator = megafon_mtype.operator
#                    mts_mtype = ModemType.objects.get(id=row.mtsModemTypeId)
#                    mts_mtype_operator = mts_mtype.operator
#                    beeline_mtype = ModemType.objects.get(id=row.beelineModemTypeId)
#                    beeline_mtype_operator = beeline_mtype.operator
#
#                    new_pt_spd_meg = SpeedAtPoint(point=new_point, operator=megafon_mtype_operator, modem_type=megafon_mtype, internet_speed=row.megafonDownloadSpeed )
#                    new_pt_spd_mts = SpeedAtPoint(point=new_point, operator=mts_mtype_operator, modem_type=mts_mtype, internet_speed=row.mtsDownloadSpeed )
#                    new_pt_spd_beel = SpeedAtPoint(point=new_point, operator=beeline_mtype_operator, modem_type=beeline_mtype, internet_speed=row.beelineDownloadSpeed )
#                    new_pt_spd_meg.save()
#                    new_pt_spd_mts.save()
#                    new_pt_spd_beel.save()
#
#        context['result'] = rows.count

        # примерное расстояние в 50 метров в координатах 0.0008982 - по долготе
        # примерное расстояние в 100 метров в координатах 0.0008982 - по широте - сделовательно примерную окружность с радиусом 50 м нужно строить в виде эллипса - потому что в виду географических проекций и формы земли - построенная окружность превратится в эллпис

        points = Point.objects.all().order_by('distinct')
        R = 0.0008982 * 10
        for curr_point in points:
            setattr(curr_point, 'is_delete', False)

        for curr_point in points:
            if curr_point.is_delete != True:
                curr_point_speed_values = curr_point.get_speed_values()
                for curr_value in curr_point_speed_values:
                    setattr(curr_value, 'avg_set', [curr_value.internet_speed,])
                curr_point_coord = curr_point.coord.split(',')
                curr_point_coord = [float(curr_point_coord[0]), float(curr_point_coord[1])]
                for point in points:
                    if point.id != curr_point.id:
                        next_point_coord = point.coord.split(',')
                        next_point_coord = [float(next_point_coord[0]), float(next_point_coord[1])]
                        #circle = (next_point_coord[0] - curr_point_coord[0])**2 + (next_point_coord[1] - curr_point_coord[1])**2
                        ellipse = ((next_point_coord[0] - curr_point_coord[0])**2/((R/2)**2)) + ((next_point_coord[1] - curr_point_coord[1])**2/(R**2))
                        #if circle <= R**2:
                        if ellipse <= 1:
                            speed_values = point.get_speed_values()
                            for curr_value in curr_point_speed_values:
                                for value in speed_values:
                                    if value.modem_type_id==curr_value.modem_type_id:
                                        curr_value.avg_set.append(value.internet_speed)
                                        #curr_value.internet_speed = (curr_value.internet_speed + value.internet_speed) / 2
                                        #curr_value.save()
                            setattr(point, 'is_delete', True)
                        else:
                            pass
                # найдём среднюю скорость, и сохраним
                for curr_value in curr_point_speed_values:
                    summ = 0
                    counter = 0
                    for val in curr_value.avg_set:
                        summ = summ + val
                        counter = counter + 1
                    curr_value.internet_speed = summ / counter
            else:
                ex = 1

        for point in points:
            if point.is_delete == True:
                speed_values = point.get_speed_values()
                for value in speed_values:
                    value.delete()
                point.delete()

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
