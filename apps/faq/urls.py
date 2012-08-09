# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *
from views import questions_list


urlpatterns = patterns('',

    url(r'^$',questions_list, name='questions_list'),
    #url(r'^sendquestion/$','apps.faq.views.question_form'),
    #url(r'^checkform/$','apps.faq.views.save_question_form'),

)