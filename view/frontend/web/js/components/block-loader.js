(function () {
    'use strict';

    var loader,
        template = [
            '<div data-role="loader" class="loading-mask breeze-block-loader" style="position: absolute;">',
                '<div class="loader">',
                    '<% if (loaderImageHref) { %>',
                        '<img src="<%= loaderImageHref %>" alt="Loading..." style="position: absolute;">',
                    '<% } %>',
                '</div>',
            '</div>'
        ].join('');

    /**
     * @param {Object} element
     * @param {Object} settings
     */
    function show(element, settings) {
        var position = element.css('position'),
            spinner = loader.clone();

        settings = settings || {};

        if (position !== 'static') {
            element.css('position', position);
        }

        element.addClass('_block-content-loading');

        if (settings.css) {
            spinner.css(settings.css);
        }

        element.append(spinner);
    }

    $.widget('blockLoader', {
        component: 'Magento_Ui/js/block-loader',

        create: function () {
            var href = this.options;

            if (!loader || href && !loader.find('img').length) {
                loader = $(_.template(template)({
                    loaderImageHref: _.isObject(href) ? false : href
                }));
            }
        },

        show: function (element, settings) {
            element = element || this.element;
            settings = settings || {};

            if (!settings.delay) {
                return show(element, settings);
            }

            if (element.data('spinner-timer')) {
                return;
            }

            element.data('spinner-timer', setTimeout(function () {
                element.data('spinner-timer', 0);
                show(element, settings);
            }, settings.delay));
        },

        hide: function (element) {
            var timerId, loaders;

            element = element || this.element;
            timerId = element.data('spinner-timer');
            loaders = element.children('.breeze-block-loader');

            if (timerId) {
                clearTimeout(timerId);
                element.data('spinner-timer', 0);
            }

            if (!loaders.length) {
                return;
            }

            if (loaders.length === 1) {
                element.css('position', '');
                element.removeClass('_block-content-loading');
            }

            loaders.first().remove();
        }
    });

    $.widget('mage.loader', 'blockLoader', {
        _create: function () {
            this._on({
                'processStop': 'hide',
                'processStart': 'show',
                'show.loader': 'show',
                'hide.loader': 'hide',
                'contentUpdated.loader': '_contentUpdated'
            });
        },

        _contentUpdated: function () {
            this.show();
        },

        show: function () {
            this._super(this.element);
        },

        hide: function () {
            this._super(this.element);
        }
    });

    $.widget('mage.loaderAjax', 'blockLoader', {
        options: {
            defaultContainer: '[data-container=body]',
            loadingClass: 'ajax-loading'
        },

        _create: function () {
            $(document).on({
                ajaxSend: this._onAjaxSend.bind(this),
                ajaxComplete: this._onAjaxComplete.bind(this),
            });
        },

        _getJqueryObj: function (loaderContext) {
            if (loaderContext) {
                return loaderContext.jquery ? loaderContext : $(loaderContext);
            }
            return $('[data-container="body"]');
        },

        _onAjaxSend: function (e, jqxhr, settings) {
            $(this.options.defaultContainer)
                .addClass(this.options.loadingClass)
                .attr('aria-busy', true);

            if (settings && settings.showLoader) {
                this._getJqueryObj(settings.loaderContext).trigger('processStart');
            }
        },

        _onAjaxComplete: function (e, jqxhr, settings) {
            $(this.options.defaultContainer)
                .removeClass(this.options.loadingClass)
                .attr('aria-busy', false);

            if (settings && settings.showLoader) {
                this._getJqueryObj(settings.loaderContext).trigger('processStop');
            }
        }
    });
})();
