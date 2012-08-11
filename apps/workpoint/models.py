# -*- coding: utf-8 -*-
from django.db.models.aggregates import Avg, Max, Count
from django.template.loader import render_to_string
from decimal import Decimal
from django.utils.translation import ugettext_lazy as _
from django.db import models
import datetime
import os
from pytils.translit import translify
from apps.utils.utils import ImageField
from django.db.models.signals import post_save
from apps.utils.managers import PublishedManager
from mptt.models import MPTTModel, TreeForeignKey, TreeManager

convert_parameter = 1024 * 102

def get_average_speed_MBs(op, point):
    point_spd_set_avg = SpeedAtPoint.objects.filter(operator__id=op.id, point__id=point.id).aggregate(
        Avg('internet_speed'))
    MBs = point_spd_set_avg['internet_speed__avg'] / convert_parameter
    return MBs


def get_point_spd_set(op, point):
    point_spd_set = SpeedAtPoint.objects.filter(operator__id=op.id, point__id=point.id).order_by(
        'modem_type__download_speed')
    return point_spd_set


def get_abilities_by_speed(speed):
    speed = Decimal("%s" % speed)
    abilities_set = Ability.objects.filter(download_speed__lte=speed)
    return abilities_set


def str_price(price):
    if not price:
        return u'0'
    value = u'%s' % price
    if price._isinteger():
        value = u'%s' % value[:len(value) - 3]
        count = 3
    else:
        count = 6

    if len(value) > count:
        ends = value[len(value) - count:]
        starts = value[:len(value) - count]

        if len(starts) > 3:
            starts = u'%s %s' % (starts[:1], starts[1:len(starts)])

        return u'%s %s' % (starts, ends)
    else:
        return u'%s' % value


def file_path_icons(instance, filename):
    return os.path.join('images', 'operatorIcons', translify(filename).replace(' ', '_'))


def file_path_ability_icons(instance, filename):
    return os.path.join('images', 'abilityIcons', translify(filename).replace(' ', '_'))


class Ability(models.Model):
    icon = ImageField(verbose_name=u'иконка', upload_to=file_path_ability_icons)
    marker = ImageField(verbose_name=u'маркер', upload_to=file_path_ability_icons)
    title = models.CharField(verbose_name=u'Название', max_length=100, )
    download_speed = models.DecimalField(verbose_name=u'достаточная скорость', help_text=u'Мбит/с', decimal_places=2,
        max_digits=10, )

    class Meta:
        ordering = ['download_speed']
        verbose_name = _(u'ability')
        verbose_name_plural = _(u'abilities')
        get_latest_by = 'download_speed'

    def __unicode__(self):
        return self.title

    def get_filter_position(self):
        min_pos = 100
        max_pos = 850
        rez = (self.download_speed * 250) + min_pos
        if rez > max_pos:
            rez = max_pos
        if rez < min_pos:
            rez = min_pos
        return rez


class City(models.Model):
    title = models.CharField(verbose_name=u'Название', max_length=100, )
    coord = models.CharField(max_length=100, verbose_name=u'Координаты центра')
    map = models.CharField(max_length=1, verbose_name=u'Карта', blank=True)
    is_published = models.BooleanField(verbose_name=u'Опубликовано', default=True)

    objects = PublishedManager()

    class Meta:
        ordering = ['-title']
        verbose_name = _(u'city')
        verbose_name_plural = _(u'cities')

    def __unicode__(self):
        return self.title

    def get_distincts(self):
        return self.distinct_set.published()

    def get_points(self):
        points_set = Point.objects.filter(distinct__city__id=self.id)
        return points_set

    def get_pts_count(self):
        points_set = self.get_points()
        all_pts_count = 0
        for point in points_set:
            point_speed_cnt = point.get_speed_values().count()
            all_pts_count = all_pts_count + point_speed_cnt
        return all_pts_count

    def get_city_speed(self, type='avg', operator=False, mdm_type=False):
        if type == 'avg':
            if  operator == False and mdm_type == False:
                points_set = self.get_points()
                summ = 0
                counter = 0
                for point in points_set:
                    pt_avg_speed = point.get_avg_speed()
                    summ = summ + pt_avg_speed
                    counter = counter + 1
                speed_value = summ / counter
            else:
                if operator and not mdm_type:
                    point_spd_set = SpeedAtPoint.objects.filter(operator=operator, point__distinct__city__id=self.id)
                    point_spd_set_avg = point_spd_set.aggregate(Avg('internet_speed'))
                    MBs = point_spd_set_avg['internet_speed__avg'] / convert_parameter
                    speed_value = MBs
        elif type == 'max':
            if  operator == False and mdm_type == False:
                points_set = self.get_points()
                max = 0
                for point in points_set:
                    pt_max_speed = point.get_max_speed()
                    if max < pt_max_speed:
                        max = pt_max_speed
                speed_value = max
            else:
                if operator and not mdm_type:
                    point_spd_set = SpeedAtPoint.objects.filter(operator=operator, point__distinct__city__id=self.id)
                    point_spd_set_avg = point_spd_set.aggregate(Max('internet_speed'))
                    MBs = point_spd_set_avg['internet_speed__max'] / convert_parameter
                    speed_value = MBs
        else:
            speed_value = False
        return speed_value


class Distinct(models.Model):
    city = models.ForeignKey(City, verbose_name=u'город')
    title = models.CharField(verbose_name=u'Название', max_length=100, )
    is_published = models.BooleanField(verbose_name=u'Опубликовано', default=True)

    objects = PublishedManager()

    class Meta:
        ordering = ['-title']
        verbose_name = _(u'distinct')
        verbose_name_plural = _(u'distincts')

    def __unicode__(self):
        return u'%s - %s' % (self.city.title, self.title)

    def get_points(self):
        return self.point_set.all()


class Point(models.Model):
    distinct = models.ForeignKey(Distinct, verbose_name=u'район')
    coord = models.CharField(max_length=100, verbose_name=u'Координаты точки')
    map = models.CharField(max_length=1, verbose_name=u'Карта', blank=True)
    datetime_create = models.DateTimeField(verbose_name=u'Дата создания точки', default=datetime.datetime.now)

    class Meta:
        ordering = ['-datetime_create']
        verbose_name = _(u'point')
        verbose_name_plural = _(u'points')

    def __unicode__(self):
        return u'%s - %s' % (self.distinct.title, self.coord)

    def get_max_speed(self):
        max_speed = self.get_speed_values().aggregate(Max('internet_speed'))['internet_speed__max']
        MBs = max_speed / convert_parameter
        return MBs

    def get_avg_speed(self):
        max_speed = self.get_speed_values().aggregate(Avg('internet_speed'))['internet_speed__avg']
        MBs = max_speed / convert_parameter
        return MBs

    def get_speed_values(self):
        return self.speedatpoint_set.all()

    def get_operators(self):
        speed_values = self.get_speed_values()
        operators = speed_values.values('operator').distinct().order_by('operator')
        id_operators = []
        for id in operators:
            id_operators.append(id['operator'])
        operators_set = Operator.objects.published().filter(id__in=id_operators)
        for operator in operators_set:
            MBs = get_average_speed_MBs(operator, self)
            MBs_str = round(MBs, 1)
            MBs_str = str(MBs_str).replace(',', '.')
            setattr(operator, 'avg_speed', MBs_str)
            setattr(operator, 'avg_speed_num', MBs)
            setattr(operator, 'abilities', get_abilities_by_speed(MBs))
            setattr(operator, 'point_spd_set', get_point_spd_set(operator, self))
        return operators_set

    def get_popup_window(self, curr_operator_title=False):
        operators = self.get_operators()
        try:
            curr_op = Operator.objects.get(title__contains=curr_operator_title)
            curr_op = curr_op.id
        except:
            curr_op = False
        popup_html = render_to_string(
            'workpoint/point_popup.html',
                {
                'point': self,
                'operators': operators,
                'curr_operator_id': curr_op,
                'abilities': self.get_abilities()
            })
        popup_html = popup_html.replace('\n', ' ')
        return popup_html

    def get_abilities(self): # максимум из средних по операторам
        speed_values = self.get_speed_values()
        operators = speed_values.values('operator').annotate(avgspeed=Avg('internet_speed')).order_by('-avgspeed')
        try:
            operators_with_max_speed = operators[0]['avgspeed']
        except:
            operators_with_max_speed = False
        if operators_with_max_speed:
            MBs = operators_with_max_speed / convert_parameter
            abilities_set = get_abilities_by_speed(MBs)
        else:
            abilities_set = []
        return abilities_set

    def get_abilitiy_icon(self):
        abilities = self.get_abilities()
        if abilities:
            last = abilities.latest()
            url = last.marker.url
        else:
            url = '/media/img/map_ic0.png'
        return url

    def get_abilitiy_icon_additional(self, op_title=False, mdm_type=False):
        try:
            orerator = Operator.objects.get(title=op_title)
        except:
            orerator = False
        if orerator:
            try:
                mdm_type = Decimal("%s" % mdm_type)
                modem_type_set = ModemType.objects.filter(operator=orerator, download_speed=mdm_type)
                modem_type_list = []
                for modem_type in modem_type_set:
                    modem_type_list.append(modem_type.id)
            except:
                modem_type_list = False
            try:
                if modem_type_list:
                    cur_spd_set = SpeedAtPoint.objects.filter(point=self, operator=orerator,
                        modem_type__id__in=modem_type_list)
                else:
                    if modem_type_list == False:
                        cur_spd_set = SpeedAtPoint.objects.filter(point=self, operator=orerator)
                    else:
                        cur_spd_set = False
            except:
                cur_spd_set = False
            if cur_spd_set:
                point_spd_set_avg = cur_spd_set.aggregate(Avg('internet_speed'))
                MBs = point_spd_set_avg['internet_speed__avg'] / convert_parameter
                abililies_set = get_abilities_by_speed(MBs)
            else:
                abililies_set = False
        else:
            try:
                mdm_type = Decimal("%s" % mdm_type)
                modem_type_set = ModemType.objects.filter(download_speed=mdm_type)
                modem_type_list = []
                for modem_type in modem_type_set:
                    modem_type_list.append(modem_type.id)
            except:
                modem_type_set = False

            if modem_type_set:
                cur_spd_set = SpeedAtPoint.objects.filter(point=self, modem_type__id__in=modem_type_list)
            else:
                cur_spd_set = False

            if cur_spd_set:
                point_spd_set_avg = cur_spd_set.aggregate(Avg('internet_speed'))
                MBs = point_spd_set_avg['internet_speed__avg'] / convert_parameter
                abililies_set = get_abilities_by_speed(MBs)
            else:
                if modem_type_set == False:
                    abililies_set = self.get_abilities()
                else:
                    abililies_set = []
        if abililies_set:
            last = abililies_set.latest()
            url = last.marker.url
        else:
            url = '/media/img/map_ic0.png'
        return url


class Operator(models.Model):
    title = models.CharField(verbose_name=u'Название', max_length=100, )
    icon = ImageField(verbose_name=u'картинка', upload_to=file_path_icons)
    order = models.IntegerField(u'порядок сортировки', help_text=u'Чем больше число, тем выше располагается элемент',
        default=10)
    is_published = models.BooleanField(verbose_name=u'Опубликовано', default=True)

    objects = PublishedManager()

    class Meta:
        ordering = ['-order']
        verbose_name = _(u'operator')
        verbose_name_plural = _(u'operators')

    def __unicode__(self):
        return self.title

    def get_modem_types(self):
        return self.modemtype_set.all()

    def get_points_speeds_types(self):
        return self.speedatpoint_set.all()


class ModemType(models.Model):
    operator = models.ForeignKey(Operator, verbose_name=u'оператор')
    vendor = models.CharField(verbose_name=u'производитель', max_length=100, )
    model = models.CharField(verbose_name=u'модель', max_length=100, )
    download_speed = models.DecimalField(verbose_name=u'скорость загрузки', decimal_places=2, max_digits=10, )

    class Meta:
        ordering = ['-vendor']
        verbose_name = _(u'modem_type')
        verbose_name_plural = _(u'modem_types')

    def __unicode__(self):
        return u'%s - %s' % (self.operator.title, self.vendor)

    def get_points_speeds_types(self):
        return self.speedatpoint_set.all()

    def get_download_speed_type(self):
        value = self.download_speed
        value = round(value, 1)
        value = str(value).replace(',', '.')
        return value


class SpeedAtPoint(models.Model):
    point = models.ForeignKey(Point, verbose_name=u'точка')
    operator = models.ForeignKey(Operator, verbose_name=u'оператор')
    modem_type = models.ForeignKey(ModemType, verbose_name=u'тим модема')
    internet_speed = models.DecimalField(verbose_name=u'скорость загрузки', decimal_places=2, max_digits=10, )

    class Meta:
        ordering = ['-point']
        verbose_name = _(u'speed_at_point')
        verbose_name_plural = _(u'speed_at_points')

    def __unicode__(self):
        return u'скорость в точке №%s' % self.point.id

    def get_MBs(self):
        MBs = self.internet_speed / convert_parameter
        MBs = round(MBs, 1)
        MBs = str(MBs).replace(',', '.')
        return MBs


# spec
class MobileInternetSpeed(models.Model):
    currentMoment = models.DateTimeField(default=datetime.datetime.now, primary_key=True)
    Latitude = models.FloatField()
    Longitude = models.FloatField()
    Adress = models.CharField(max_length=300, blank=True, null=True)
    Route = models.CharField(max_length=300, blank=True, null=True)
    Street_address = models.IntegerField(blank=True, null=True)
    Administrative_area_level_2 = models.CharField(max_length=45, blank=True, null=True)
    Locality = models.CharField(max_length=45, blank=True, null=True)
    Country = models.CharField(max_length=45, blank=True, null=True)
    Postal_code = models.IntegerField(blank=True, null=True, default=-1)
    megafonDownloadSpeed = models.IntegerField(default=-1)
    mtsDownloadSpeed = models.IntegerField(default=-1)
    beelineDownloadSpeed = models.IntegerField(default=-1)
    megafonUploadSpeed = models.IntegerField(default=-1)
    mtsUploadSpeed = models.IntegerField(default=-1)
    beelineUploadSpeed = models.IntegerField(default=-1)
    megafonModemTypeId = models.IntegerField(default=0)
    mtsModemTypeId = models.IntegerField(default=0)
    beelineModemTypeId = models.IntegerField(default=0)

    class Meta:
        ordering = ['-currentMoment']

    def __unicode__(self):
        return u'%s' % self.currentMoment