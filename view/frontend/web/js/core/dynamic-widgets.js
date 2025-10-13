(() => {
    'use strict';

    var config = JSON.parse($('[type="breeze/dynamic-js"]').text());

    $.breeze.jsbundles = config.bundles;
    $.breeze.jsignore = config.ignore;

    try {
        config.ignore.forEach(alias => {
            $.breezemap[alias] = false;
        });
        $.each($.breeze.jsbundles, (bundle, items) => {
            $.each(items, (alias, values) => {
                if (values.ref) {
                    $.breeze.jsconfig[alias] = items[values.ref];
                    $.breeze.jsconfig[alias].ref = values.ref;
                } else {
                    $.breeze.jsconfig[alias] = values;
                }
                $.breeze.jsconfig[alias].bundle = bundle;

                if (values.global) {
                    require.config({
                        shim: {
                            [alias]: {
                                exports: values.global
                            }
                        }
                    });
                }
            });
        });
        $.each($.breeze.jsconfig, (alias, values) => {
            (values.import || []).forEach(path => {
                if (!$.breeze.jsconfig[path]) {
                    $.breeze.jsconfig[path] = {
                        path,
                        bundle: values.bundle
                    };
                }
            });
        });
    } catch (e) {
        console.log(e);
    }

    $.each($.breeze.jsconfig, alias => {
        if ($.fn[alias] || !/^[a-zA-Z_.]+$/.test(alias)) {
            return;
        }
        $.fn[alias] = function (settings) {
            $(document).on('breeze:load', () => {
                // eslint-disable-next-line max-nested-callbacks
                require([alias], () => {
                    if (!this[alias].__dynamic) {
                        this[alias](settings);
                    }
                });
            });
            return this;
        };
        $.fn[alias].__dynamic = true;
    });
})();
