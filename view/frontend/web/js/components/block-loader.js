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

        if (position !== 'absolute' && position !== 'fixed') {
            element.css('position', position);
        }

        element.addClass('_block-content-loading');

        if (settings.css) {
            spinner.css(settings.css);
        }

        element.append(spinner);
    }

    /**
     * @param {Object} element
     * @param {Object} settings
     */
    function delayedShow(element, settings) {
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
    }

    /**
     * @param {Object} element
     */
    function hide(element) {
        var timerId = element.data('spinner-timer'),
            loaders = element.find('.breeze-block-loader');

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

    $.widget('blockLoader', {
        component: 'Magento_Ui/js/block-loader',

        create: function () {
            var href = this.options;

            if (!loader) {
                loader = $(_.template(template)({
                    loaderImageHref: _.isObject(href) ? false : href
                }));
            }
        },
        show: delayedShow,
        hide: hide
    });
})();
