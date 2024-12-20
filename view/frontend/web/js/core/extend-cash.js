(function () {
    'use strict';

    var _$ = $;

    window.$ = function (selector, context) {
        var result = _$(selector, context);

        // HANDLE: $(html, props)
        // See: https://github.com/jquery/jquery/blob/main/src/core/init.js#L76
        if (typeof selector === 'string' &&
            $.isPlainObject(context) &&
            selector.trim().startsWith('<')
        ) {
            for (const [key, value] of Object.entries(context)) {
                if (typeof result[key] === 'function') {
                    result[key](value);
                } else {
                    result.attr(key, value);
                }
            }
        }

        return result;
    };

    Object.assign(window.$, _$);

    // Trigger shortcuts
    (() => {
        var methods = [
            'click',
            'select',
            'submit',
            'scroll',
            'blur',
            'focus'
        ];

        $.each(methods, function () {
            var method = this;

            /** Native methods proxy */
            $.fn[method] = function (callback) {
                if (callback) {
                    return this.on(method, callback);
                }

                return this.each(function () {
                    var event = document.createEvent('Event');

                    event.initEvent(method, true, true);

                    $(this).trigger(event);

                    if (!event.defaultPrevented && method !== 'click' && this[method]) {
                        this[method]();
                    }
                });
            };
        });
    })();

    function isVisible(i, el) {
        return el.offsetWidth || el.offsetHeight || el.getClientRects().length;
    }

    function isHidden(i, el) {
        return !isVisible(i, el);
    }

    /** Return visible elements */
    $.fn.visible = function () {
        return this.filter(isVisible);
    };

    /** Checks if element is visible */
    $.fn.isVisible = function () {
        return this.visible().length > 0;
    };

    /** Return hidden elements */
    $.fn.hidden = function () {
        return this.filter(isHidden);
    };

    /** Checks if element is hidden */
    $.fn.isHidden = function () {
        return this.hidden().length > 0;
    };

    $.fn.uniqueId = function () {
        if (this.attr('id')) {
            return this;
        }
        return this.attr('id', 'ui-id-' + $.guid++);
    };

    $.fn.removeUniqueId = function () {
        if (!this.attr('id') || !this.attr('id').startsWith('ui-id-')) {
            return this;
        }
        return this.removeAttr('id');
    };

    function inViewport(i, el) {
        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= $(window).height() &&
            rect.right <= $(window).width()
        );
    }

    /** Return elements that are inside viewport */
    $.fn.inViewport = function () {
        return this.filter(inViewport);
    };

    /** Checks if element is inside viewport */
    $.fn.isInViewport = function () {
        return this.inViewport().length > 0;
    };

    /** Toggle block loader on the element */
    $.fn.spinner = function (flag, settings) {
        return this.each(function () {
            require(['Magento_Ui/js/block-loader'], () => {
                if (flag) {
                    $.fn.blockLoader().show($(this), settings);
                } else {
                    $.fn.blockLoader().hide($(this));
                }
            });
        });
    };

    $.fn.fadeIn = $.fn.show;
    $.fn.fadeOut = $.fn.hide;
    $.fn.bind = $.fn.on;
    $.fn.unbind = $.fn.off;
    $.fn.ajaxComplete = (handler) => {
        $(document).on('ajaxComplete', (event, data) => {
            handler(event, data, data.settings);
        });
    };

    $.each({ scrollLeft: 'pageXOffset', scrollTop: 'pageYOffset' }, function (method, prop) {
        var top = prop === 'pageYOffset';

        $.fn[method] = function (val) {
            var win, el = this.get(0);

            if (el.window === el) {
                win = el;
            } else if (el.nodeType === 9) {
                win = el.defaultView;
            }

            if (val === undefined) {
                return win ? win[prop] : el?.[method];
            }

            if (win) {
                win.scroll(
                    !top ? val : win.pageXOffset,
                    top ? val : win.pageYOffset
                );
            } else if (el) {
                el[method] = val;
            }

            return this;
        };
    });

    /** Evaluates bindings specified in each DOM element of collection. */
    $.fn.applyBindings = function () {
        return this.each(function () {
            ko.applyBindings(ko.contextFor(this), this);
        });
    };

    $.fn.mage = function (component, config) {
        this.each((i, el) => require('mage/apply/main').applyFor(el, config || {}, component));
        return this;
    };

    $.fn.text = _.wrap($.fn.text, function (original, text) {
        if (typeof text === 'function') {
            return $(this).each((i, el) => {
                $(el).text(text(i, $(el).text()));
            });
        }
        return original.bind(this)(text);
    });

    $.fn.html = _.wrap($.fn.html, function (original, html) {
        if (typeof html === 'object') {
            return $(this).text('').append(html);
        }
        return original.apply(this, Array.prototype.slice.call(arguments, 1));
    });

    $.fn.trigger = _.wrap($.fn.trigger, function (original, event, data) {
        if (typeof event === 'string' && event === 'submit' && this.closest('form')) {
            this.one(event, function (e) {
                setTimeout(() => { // allow prevent default in document listener
                    if (!e.defaultPrevented) {
                        this.closest('form').submit();
                    }
                }, 10);
            });
        }
        return original.bind(this)(event, data);
    });

    $.fn.on = _.wrap($.fn.on, function (original, eventName, handler, selector, data, one) {
        if (typeof eventName === 'string' && eventName === 'breeze:load' && $.breeze.ready) {
            handler?.();
            if (one) {
                return;
            }
        }

        return original.apply(this, Array.prototype.slice.call(arguments, 1));
    });

    function normalizeSelector(selector) {
        if (typeof selector !== 'string') {
            return selector;
        }

        selector = selector.split(',').map(s => {
            s = s.trim();

            if (['>', '+', '~'].includes(s[0])) {
                s = ':scope ' + s;
            }

            return s;
        }).join(',');

        ['button', 'checkbox', 'hidden', 'image', 'password', 'radio', 'submit', 'text'].forEach(type => {
            selector = selector.replaceAll(`:${type}`, `[type="${type}"]`);
        });

        if (selector.includes('[') && selector.includes('=')) {
            selector = selector.replaceAll(/\[([\w-]+)?=(\d+)\]/g, '[$1="$2"]');
        }

        return selector
            .replaceAll(':selected', ':checked')
            .replaceAll(':input', ':where(input, select, textarea, button)');
    }

    $.fn.is = _.wrap($.fn.is, function (original, selector) {
        switch (selector) {
            case ':visible':
                return this.isVisible();

            case ':hidden':
                return this.isHidden();

            case ':selected':
                return this.filter(function () {
                    return this.selected;
                }).length > 0;

            case ':checked':
                return this.filter(function () {
                    return this.checked;
                }).length > 0;
        }

        return original.bind(this)(normalizeSelector(selector));
    });

    $.fn.find = _.wrap($.fn.find, function (original, selector) {
        if (selector instanceof Node) {
            return this[0].contains(selector) ? $(selector) : $();
        }

        return original.bind(this)(selector);
    });

    [Document, Element].forEach(Item => {
        Item.prototype.querySelectorAll = _.wrap(
            Item.prototype.querySelectorAll,
            function (o, selector) {
                return o.bind(this)(normalizeSelector(selector));
            }
        );
    });

    $.fn.component = function (key, value) {
        key = $.breezemap.__aliases[key] || key;
        return value === undefined ? this.data(`component:${key}`) : this.data(`component:${key}`, value);
    };

    $.fn.data = _.wrap($.fn.data, function (original, key, value) {
        var collection = this,
            result,
            cleanKey,
            keys = [];

        if (value === undefined) {
            this.each(function () {
                if (this.__breeze && this.__breeze[key]) {
                    result = this.__breeze[key];

                    return false;
                }
            });

            if (result !== undefined) {
                return result;
            }
        } else if (typeof value === 'object' || typeof value === 'function') {
            return this.each(function () {
                this.__breeze = this.__breeze || {};
                this.__breeze[key] = value;
            });
        }

        result = original.apply(
            this,
            Array.prototype.slice.call(arguments, 1)
        );

        if (result === undefined && collection[0] && $.registry) {
            cleanKey = key.replace(/^[^A-Z]+/, ''); // mageSwatchRenderer => SwatchRenderer
            keys = [
                key,
                cleanKey,
                cleanKey.charAt(0).toLowerCase() + cleanKey.slice(1)
            ];

            $.each(keys, function (i, widgetName) {
                result = $.registry.get(widgetName, collection[0]);

                if (result) {
                    return false;
                }
            });
        }

        return result;
    });

    function setOffset(elem, options, i) {
        var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
            curElem = $(elem),
            position = curElem.css('position'),
            props = {};

        if (position === 'static') {
            elem.style.position = 'relative';
        }

        curOffset = curElem.offset();
        curCSSTop = curElem.css('top');
        curCSSLeft = curElem.css('left');
        calculatePosition = (position === 'absolute' || position === 'fixed') &&
            (curCSSTop + curCSSLeft).indexOf('auto') > -1;

        if (calculatePosition) {
            curPosition = curElem.position();
            curTop = curPosition.top;
            curLeft = curPosition.left;
        } else {
            curTop = parseFloat(curCSSTop) || 0;
            curLeft = parseFloat(curCSSLeft) || 0;
        }

        if (typeof options === 'function') {
            options = options.call(elem, i, $.extend({}, curOffset));
        }

        if (options.top != null) {
            props.top = (options.top - curOffset.top) + curTop;
        }
        if (options.left != null) {
            props.left = (options.left - curOffset.left) + curLeft;
        }

        if ('using' in options) {
            options.using.call(elem, props);
        } else {
            curElem.css(props);
        }
    }

    $.fn.offset = _.wrap($.fn.offset, function (original, options) {
        if (arguments.length > 1) {
            return options === undefined ? this : this.each(function (i) {
                setOffset(this, options, i);
            });
        }
        return original.bind(this)();
    });

    $.fn.hover = function (mouseenter, mouseleave) {
        this.on('mouseenter', mouseenter).on('mouseleave', mouseleave);
    };

    /** Copy of magento's zIndex function */
    $.fn.zIndex = function (zIndex) {
        var elem = $(this[0]),
            position,
            value;

        if (zIndex !== undefined) {
            return this.css('zIndex', zIndex);
        }

        if (!this.length) {
            return 0;
        }

        while (elem.length && elem[0] !== document) {
            position = elem.css('position');
            value = parseInt(elem.css('zIndex'), 10);
            elem = elem.parent();

            if (position === 'static') {
                continue;
            }

            if (!isNaN(value) && value !== 0) {
                return value;
            }
        }

        return 0;
    };

    /**
     * Constraint element inside visible viewport or overflowed parent
     * @return {Cash}
     */
    $.fn.contstraint = function (options) {
        var left, right, top, bottom,
            css = { top: '', left: '', right: '', bottom: '' },
            parent = this.parentsUntil('body', (i, el) => $(el).css('overflow') !== 'visible'),
            parentRect = {
                top: parent.offset()?.top || window.scrollY,
                left: parent.offset()?.left || window.scrollX,
                width: parent.outerWidth() || $(window).width(),
                height: parent.outerHeight() || $(window).height(),
            };

        if (!this.length) {
            return this;
        }

        this.css(css);

        options = $.extend({
            x: true,
            y: true,
        }, options);

        if (options.x) {
            left = Math.round(this.offset().left) - parentRect.left;
            right = left + this.outerWidth();

            if (left < 0) {
                css.left = 'auto';
                css.right = parseFloat(this.css('right')) + (left - 10);
            } else if (left > 0 && right > parentRect.width) {
                css.left = 'auto';
                css.right = Math.min(parseFloat(this.css('right')) + left, 0);
            }
        }

        if (options.y) {
            top = Math.round(this.offset().top) - parentRect.top;
            bottom = top + this.outerHeight();

            if (top > this.outerHeight() + 50 && // is fully visible if expanded to top?
                bottom > parentRect.height + 10 // is more that 10px is invisible?
            ) {
                css.top = 'auto';
                css.bottom = '100%';
            }
        }

        return this.css(css);
    };

    $.fn.var = function (name, value) {
        var el = this[0];

        if (value !== undefined) {
            el.style.setProperty(name, value);

            return this;
        }

        return getComputedStyle(el).getPropertyValue(name);
    };

    $.fn.serializeJSON = function () {
        return Object.fromEntries((new FormData(this[0])).entries());
    };

    $.fn.serializeArray = function () {
        return Array.from((new FormData(this[0])).entries()).map(([name, value]) => ({name, value}));
    };

    $.proxy = _.bind;
    $.map = _.map;
    $.now = Date.now;
    $.isEmptyObject = _.isEmpty;
    $.inArray = (elem, arr, i) => arr == null ? -1 : Array.prototype.indexOf.call(arr, elem, i);

    $.each = _.wrap($.each, function (original, object, callback) {
        return original(object || [], callback);
    });

    /** Serialize object to query string */
    $.param = $.params = function (params, prefix, doNotEncode) {
        if (params instanceof FormData) {
            return new URLSearchParams(params).toString();
        }

        return Object.entries(params).map(([key, value]) => {
            if (value === undefined) {
                return false;
            }

            if (params.constructor === Array) {
                key = `${prefix}[]`;
            } else if (params.constructor === Object) {
                key = prefix ? `${prefix}[${key}]` : key;
            }

            if (value && typeof value === 'object') {
                return $.params(value, key, doNotEncode);
            } else if (typeof value === 'function') {
                try {
                    value = value();
                } catch (err) {
                    return false;
                }
            }

            return doNotEncode ? `${key}=${value}` : `${key}=${encodeURIComponent(value)}`;
        }).filter(item => item).join('&');
    };

    /** Parse url query params */
    $.parseQuery = function (query) {
        var result = {};

        query = query || window.location.search;
        query = query.replace(/^\?/, '');

        $.each(query.split('&'), function (i, param) {
            var pair = param.split('='),
                key = decodeURIComponent(pair.shift().replace('+', ' ')).toString(),
                value = decodeURIComponent(pair.length ? pair.join('=').replace('+', ' ') : null);

            result[key] = value;
        });

        return result;
    };

    /** The main difference with .extend is that arrays are overriden instead of inherited */
    $.extendProps = function (own, inherited) {
        var destination = {};

        $.each(own, function (key, value) {
            if ($.isPlainObject(value)) {
                destination[key] = $.extendProps(own[key], inherited[key] || {});
            } else {
                destination[key] = $.copyProp(value);
            }
        });

        $.each(inherited, function (key, value) {
            if (typeof own[key] !== 'undefined') {
                return;
            }

            if ($.isPlainObject(value)) {
                destination[key] = $.extendProps(own[key] || {}, inherited[key]);
            } else {
                destination[key] = $.copyProp(value);
            }
        });

        return destination;
    };

    $.copyProp = function (value) {
        if ($.isPlainObject(value)) {
            return $.extendProps(value, {});
        }

        if (Array.isArray(value)) {
            return Array.from(value);
        }

        return value;
    };

    $.Deferred = (fn) => {
        var deferred = new function Defer() {
            var promise = new Promise((resolve, reject) => {
                this.resolve = (...args) => {
                    resolve(...args);
                    return promise;
                };
                this.reject = (...args) => {
                    reject(...args);
                    return promise;
                };
            }).then(result => {
                this.stateText = 'resolved';
                return result;
            }).catch(() => {
                this.stateText = 'rejected';
            });

            promise.finally = _.wrap(promise.finally, (o, onFinally) => {
                o.bind(promise)(onFinally);
                return this;
            });

            promise.then = _.wrap(promise.then, (o, onFulfilled, onRejected) => {
                o.bind(promise)(onFulfilled, onRejected);
                return this;
            });

            promise.catch = _.wrap(promise.catch, (o, onRejected) => {
                o.bind(promise)(onRejected);
                return this;
            });

            this.always = promise.always = promise.finally.bind(promise);
            this.done = this.then = promise.done = promise.then.bind(promise);
            this.fail = promise.fail = promise.catch.bind(promise);
            this.stateText = 'pending';
            this.state = () => this.stateText;
            this.promise = () => promise;
        };

        if (fn) {
            fn(deferred);
        }

        return deferred;
    };

    $.onReveal = function (element, callback, options = {}) {
        var revealObserver = new IntersectionObserver(entries => {
            var nodes = entries
                .filter(entry => entry.isIntersecting)
                .map(entry => entry.target);

            if (nodes.length) {
                callback($(nodes));
                nodes.forEach(el => revealObserver.unobserve(el));
            }
        }, options);

        $(element).each((i, el) => revealObserver.observe(el));

        return revealObserver;
    };

    $.fn.onReveal = function (callback, options = {}) {
        $.onReveal(this, callback, options);
        return this;
    };

    //Microtasks
    (() => {
        var methods = [
            'addClass',
            'after',
            'append',
            'appendTo',
            'before',
            'hide',
            'insertAfter',
            'insertBefore',
            'off',
            'on',
            'prepend',
            'prependTo',
            'remove',
        ];

        $.fn.microtasks = function (chunkSize = 1200) {
            if (this.microtasksProxy) {
                return this.microtasksProxy;
            }

            this.microtasksProxy = new Proxy(this, {
                get(target, prop) {
                    if (!methods.includes(prop)) {
                        return target[prop];
                    }

                    return (...args) => {
                        _.chunk(target, chunkSize).forEach(chunk => setTimeout(() => $(chunk)[prop](...args)));
                        return target.microtasksProxy;
                    };
                }
            });

            return this.microtasksProxy;
        };
    })();
})();
