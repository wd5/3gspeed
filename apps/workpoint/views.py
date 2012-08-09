# -*- coding: utf-8 -*-
import os, md5
from datetime import datetime, date, timedelta
from django.http import Http404, HttpResponse, HttpResponseBadRequest, HttpResponseRedirect, HttpResponseForbidden
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Max, Min, Count

from django.views.generic import ListView, DetailView, DetailView, TemplateView, View

from models import Operator, ModemType


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
                html_code = u'%s<option value="%s">%s - %s - %s</option>' % (html_code, type.id, type.vendor, type.model, type.download_speed)
            return HttpResponse(html_code)
        else:
            return HttpResponseBadRequest(u'<option value="" selected="selected">---------</option>')

load_modem_types = LoadMTypesAdmin.as_view()
