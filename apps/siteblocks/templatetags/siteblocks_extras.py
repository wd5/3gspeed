# -*- coding: utf-8 -*-
from apps.siteblocks.models import Settings
from django import template
from django.conf import settings
from django.template import Library, Node, Variable, VariableDoesNotExist
from django.utils.translation import ugettext_lazy as _

import tokenize
import StringIO

register = template.Library()

#@register.inclusion_tag("siteblocks/block_menu.html")
#def block_menu(url):
#    url = url.split('/')
#
#    if url[1]:
#        current = u'/%s/' % url[1]
#    else:
#        current = u'/'
#    return {'menu': menu, 'current': current}

@register.inclusion_tag("siteblocks/block_setting.html")
def block_static(name):
    try:
        setting = Settings.objects.get(name = name)
    except Settings.DoesNotExist:
        setting = False
    return {'block': block,}

def formatted_float(value):
    return str(value).replace(',','.')

register.filter('formatted_float', formatted_float)

class CallNode(Node):
    def __init__(self, method, varname, *args, **kwargs):
        self.method     = method
        self.varname    = varname
        self.args       = args
        self.kwargs     = kwargs

    def render(self, context):
        try:
            try:
                obj, method = self.method.resolve(context).rsplit('.',1)
            except:
                raise

            obj = Variable(obj).resolve(context)
            method = getattr(obj,method)

            args = []
            kwargs = {}
            for i in self.args:
                args.append( Variable(i).resolve(context) )
            for key, value in self.kwargs.items():
                kwargs[key] = Variable(value).resolve(context)

            if not self.varname :
                return method(*args,**kwargs)
            else:
                context[self.varname] = method(*args,**kwargs)
                return ''
        except:
            if settings.TEMPLATE_DEBUG:
                raise
            return ''

def do_call(parser, token):
    """
    Example::

        {% call "foo.some_method" %}
        {% call "foo.some_method" with arg1 arg2 ... argn %}
        {% call "foo.some_method" with arg1 arg2 ... argn as varname %}
    """
    bits = token.contents.split()
    varname = None
    if 'as' in bits :
        pos = bits.index('as')
        varname = bits[pos+1]
        bits = bits[:pos]

    if 'with' in bits: #has 'with' key
        pos = bits.index('with')
        argslist = bits[pos+1:]
        bits = bits[:pos]
    else:
        argslist = []

    if len(bits) != 2:
        raise TemplateSyntaxError, "%r tag takes one argument: the method name to call" % bits[0]
    method = parser.compile_filter(bits[1])

    args = []
    kwargs = {}
    if argslist:
        for i in argslist:
            if '=' in i:
                a, b = i.split('=', 1)
                a = a.strip()
                b = b.strip()
                buf = StringIO.StringIO(a)
                keys = list(tokenize.generate_tokens(buf.readline))
                if keys[0][0] == tokenize.NAME:
                    kwargs[a] = b
                else:
                    raise TemplateSyntaxError, "Argument syntax wrong: should be key=value"
            else:
                args.append(i)

    return CallNode(method, varname, *args, **kwargs)

register.tag('call', do_call)