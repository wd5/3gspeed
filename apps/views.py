# -*- coding: utf-8 -*-
from django.template.loader import render_to_string
from django.views.generic import TemplateView
from apps.siteblocks.models import Settings
from apps.newsboard.models import News
from apps.workpoint.models import Operator, Point, Ability, SpeedAtPoint, City, Distinct, ModemType, MobileInternetSpeed


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
        operators = Operator.objects.published()
        context['operators'] = operators

        #        popup_html = render_to_string(
        #            'workpoint/point_popup.html',
        #                {})
        #        popup_html = popup_html.replace('\n', ' ')
        #        context['balloonLayout'] = popup_html

        mtypes = ModemType.objects.values('download_speed').distinct().order_by('download_speed')
        context['mtypes'] = mtypes
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

        for row in rows:
            try:
                distinct = Distinct.objects.get(title=row.Route)
            except:
                distinct = False
            coords = u'%s,%s' % (row.Latitude, row.Longitude)
            if distinct:
                try:
                    point = Point.objects.get(coord=coords)
                except:
                    point = False
                if point:
                    speed_values = point.get_speed_values()
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
                                value.save()
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
        return context

db_copy = DBCopyView.as_view()