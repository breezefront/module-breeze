/* global _ */
(function () {
    'use strict';

    var loader,
        template = [
            '<div data-role="loader" class="loading-mask" style="position: absolute;">',
                '<div class="loader">',
                    '<img src="<%= loaderImageHref %>" alt="Loading..." style="position: absolute;">',
                '</div>',
            '</div>'
        ].join('');

    /**
     * @param {Object} element
     */
    function show(element, settings) {
        var position = element.css('position'),
            spinner = loader.clone();

        settings = settings || {};

        if (position !== 'absolute' && position !== 'fixed') {
            element.addClass('_block-content-loading');
        }

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
        var timerId = element.data('spinner-timer');

        if (timerId) {
            clearTimeout(timerId);
            element.data('spinner-timer', 0);
        }

        if (!element.has('.loading-mask').length) {
            return;
        }
        element.find('.loading-mask').remove();
        element.removeClass('_block-content-loading');
    }

    $.widget('blockLoader', {
        component: 'Magento_Ui/js/block-loader',

        /** [create description] */
        create: function () {
            var href = this.options;

            if (!loader && !_.isEmpty(href)) {
                loader = $(_.template(template)({
                    loaderImageHref: href
                }));
            }
        },
        show: delayedShow, // @todo Promise
        hide: hide  // @todo Promise
    });
})();
