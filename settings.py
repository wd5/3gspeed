# -*- coding: utf-8 -*-
DATABASE_NAME = u'3gspeed'
PROJECT_NAME = u'3gspeed'
SITE_NAME = u'3G Speed'
DEFAULT_FROM_EMAIL = u'support@3gspeed.octweb.ru'

from config.base import *

try:
    from config.development import *
except ImportError:
    from config.production import *

TEMPLATE_DEBUG = DEBUG

INSTALLED_APPS += (
    'apps.siteblocks',
    #'apps.pages',
    #'apps.faq',
    'apps.newsboard',
    'apps.workpoint',



    'sorl.thumbnail',
    #'south',
    #'captcha',
)

MIDDLEWARE_CLASSES += (
    #'apps.pages.middleware.PageFallbackMiddleware',
)

TEMPLATE_CONTEXT_PROCESSORS += (
    #'apps.pages.context_processors.meta',
    'apps.siteblocks.context_processors.settings',
    'apps.workpoint.context_processors.is_processing',
)