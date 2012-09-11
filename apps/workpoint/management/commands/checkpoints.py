# -*- coding: utf-8 -*-
__author__ = 'yzero'
import datetime
from decimal import Decimal
from django.views.generic.base import TemplateView
from django.core.management.base import BaseCommand, CommandError
from apps.workpoint.models import Point, SpeedAtPoint, City, Distinct, ModemType, MobileInternetSpeed


# в терминале /home/yzero/projects/3gspeed/manage.py checkpoints

class Command(BaseCommand):
    def handle(self, *args, **options):
        last_point = Point.objects.latest() # вытащим последнюю по дате точку
        rows = MobileInternetSpeed.objects.filter(
            currentMoment__gte=last_point.datetime_create) # вытащим из таблицы замеров все точки которые позже последней даты

        for row in rows:
            # проверим и добавим новые города
            city_title = row.Locality
            if city_title == None:
                curr_city = False
            else:
                try:
                    curr_city = City.objects.get(title=city_title)
                except:
                    curr_city = False
                if not curr_city:
                    curr_city = City(title=city_title, title_second=city_title,
                        coord='55.74171597849616,37.62739700271333')
                    curr_city.save()
            # проверим и добавим новые улицы
            distinct_title = row.Route
            if distinct_title == None:
                distinct = False
            else:
                try:
                    distinct = Distinct.objects.get(title=distinct_title)
                except:
                    distinct = False
                if not distinct:
                    if curr_city:
                        distinct = Distinct(city=curr_city, title=distinct_title)
                        distinct.save()
                    else:
                        distinct = False

            coords = u'%s,%s' % (row.Latitude, row.Longitude)
            if distinct:
                try:
                    point = Point.objects.get(coord=coords, datetime_create=last_point.datetime_create)
                except:
                    point = False
                if point: # если точка совпала с последней по дате и координатам - то не добавляем её
                    pass
                else:
                    new_point = Point(distinct=distinct, coord=coords, datetime_create=row.currentMoment)
                    new_point.save()
                    megafon_mtype = ModemType.objects.get(id=row.megafonModemTypeId)
                    megafon_mtype_operator = megafon_mtype.operator
                    mts_mtype = ModemType.objects.get(id=row.mtsModemTypeId)
                    mts_mtype_operator = mts_mtype.operator
                    beeline_mtype = ModemType.objects.get(id=row.beelineModemTypeId)
                    beeline_mtype_operator = beeline_mtype.operator

                    new_pt_spd_meg = SpeedAtPoint(point=new_point, operator=megafon_mtype_operator, modem_type=megafon_mtype
                        , internet_speed=row.megafonDownloadSpeed)
                    new_pt_spd_mts = SpeedAtPoint(point=new_point, operator=mts_mtype_operator, modem_type=mts_mtype,
                        internet_speed=row.mtsDownloadSpeed)
                    new_pt_spd_beel = SpeedAtPoint(point=new_point, operator=beeline_mtype_operator,
                        modem_type=beeline_mtype, internet_speed=row.beelineDownloadSpeed)
                    new_pt_spd_meg.save()
                    new_pt_spd_mts.save()
                    new_pt_spd_beel.save()
                    print 'ok'


class TestView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super(TestView, self).get_context_data(**kwargs)

        last_point = Point.objects.latest() # вытащим последнюю по дате точку
        rows = MobileInternetSpeed.objects.filter(
            currentMoment__gte=last_point.datetime_create) # вытащим из таблицы замеров все точки которые позже последней даты

        for row in rows:
            # проверим и добавим новые города
            city_title = row.Locality
            if city_title == None:
                curr_city = False
            else:
                try:
                    curr_city = City.objects.get(title=city_title)
                except:
                    curr_city = False
                if not curr_city:
                    curr_city = City(title=city_title, title_second=city_title,
                        coord='55.74171597849616,37.62739700271333')
                    curr_city.save()
            # проверим и добавим новые улицы
            distinct_title = row.Route
            if distinct_title == None:
                distinct = False
            else:
                try:
                    distinct = Distinct.objects.get(title=distinct_title)
                except:
                    distinct = False
                if not distinct:
                    if curr_city:
                        distinct = Distinct(city=curr_city, title=distinct_title)
                        distinct.save()
                    else:
                        distinct = False

            coords = u'%s,%s' % (row.Latitude, row.Longitude)
            if distinct:
                try:
                    point = Point.objects.get(coord=coords, datetime_create=last_point.datetime_create)
                except:
                    point = False
                if point: # если точка совпала с последней по дате и координатам - то не добавляем её
                    pass
                else:
                    new_point = Point(distinct=distinct, coord=coords, datetime_create=row.currentMoment)
                    new_point.save()
                    megafon_mtype = ModemType.objects.get(id=row.megafonModemTypeId)
                    megafon_mtype_operator = megafon_mtype.operator
                    mts_mtype = ModemType.objects.get(id=row.mtsModemTypeId)
                    mts_mtype_operator = mts_mtype.operator
                    beeline_mtype = ModemType.objects.get(id=row.beelineModemTypeId)
                    beeline_mtype_operator = beeline_mtype.operator

                    new_pt_spd_meg = SpeedAtPoint(point=new_point, operator=megafon_mtype_operator, modem_type=megafon_mtype
                        , internet_speed=row.megafonDownloadSpeed)
                    new_pt_spd_mts = SpeedAtPoint(point=new_point, operator=mts_mtype_operator, modem_type=mts_mtype,
                        internet_speed=row.mtsDownloadSpeed)
                    new_pt_spd_beel = SpeedAtPoint(point=new_point, operator=beeline_mtype_operator,
                        modem_type=beeline_mtype, internet_speed=row.beelineDownloadSpeed)
                    new_pt_spd_meg.save()
                    new_pt_spd_mts.save()
                    new_pt_spd_beel.save()

