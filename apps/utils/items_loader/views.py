# -*- coding: utf-8 -*-
from django.views.generic import View
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest
from django.db.models.loading import get_model
from django.template.loader import render_to_string

class ItemsLoaderView(View):
    def post(self, request, *args, **kwargs):
        if not request.is_ajax():
            return HttpResponseRedirect('/')
        else:
            if 'cnt' not in request.POST or 'init_cnt' not in request.POST or 'm_name' not in request.POST or 'a_name' not in request.POST or 'template' not in request.POST:
                return HttpResponseBadRequest()

            count = request.POST['cnt']
            try:
                count = int(count)
            except ValueError:
                return HttpResponseBadRequest()

            initial_count = request.POST['init_cnt']
            try:
                initial_count = int(initial_count)
            except ValueError:
                return HttpResponseBadRequest()

            app_name = request.POST['a_name']
            model_name = request.POST['m_name']
            template = request.POST['template']
            model = get_model(app_name, model_name)
            endrange = initial_count + count

            try:
                add_parameter = request.POST['add_parameter']
            except:
                add_parameter = False

            if add_parameter:
                param = add_parameter.split('|')
                try:
                    qs_item = model.objects.get(id=param[0])
                    try:
                        exec('queryset = qs_item.%s' % param[1])
                    except:
                        HttpResponseBadRequest()
                except model.DoesNotExist:
                    return HttpResponseBadRequest()
            elif model:
                try:
                    queryset = model.objects.published()
                except model.DoesNotExist:
                    return HttpResponseBadRequest()
            else:
                return HttpResponseBadRequest()

            remaining_count = queryset.count() - endrange
            queryset = queryset[initial_count:endrange]
            if count < remaining_count:
                remaining_count = False

            response = HttpResponse()
            load_template = 'items_loader/%s_load_template.html' % template
            items_html = render_to_string(
                'items_loader/base_loader.html',
                    {'items': queryset, 'load_template': load_template, 'endrange': endrange,
                     'remaining_count': remaining_count, }
            )
            response.content = items_html
            return response

items_loader = ItemsLoaderView.as_view()