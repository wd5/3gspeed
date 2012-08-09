# -*- coding: utf-8 -*-

from settings import DATABASE_NAME
DEBUG = True

DATABASES = {
    'default': {
	'ENGINE': 'mysql', # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
	'NAME': DATABASE_NAME,                      # Or path to database file if using sqlite3.
	'USER': 'root',                      # Not used with sqlite3.
	'PASSWORD': 'otmcyoQav',                  # Not used with sqlite3.
	'HOST': '127.0.0.1',                      # Set to empty string for localhost. Not used with sqlite3.
	'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
    }
}
EMAIL_PORT = 25
TIME_ZONE = 'Europe/Moscow'
#TIME_ZONE = 'Asia/Yakutsk'
