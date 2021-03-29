/* global breeze _ */
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
    function show(element) {
        var position = element.css('position');

        element.find(':focus').blur();
        element.find('input:disabled, select:disabled').addClass('_disabled');
        element.find('input, select').prop('disabled', true);

        if (position !== 'absolute' && position !== 'fixed') {
            element.addClass('_block-content-loading');
        }

        element.append(loader.clone());
    }

    /**
     * @param {Object} element
     */
    function hide(element) {
        if (!element.has('.loading-mask').length) {
            return;
        }
        element.find('.loading-mask').remove();
        element.find('input, select').not('._disabled').prop('disabled', false);
        element.find('input:disabled, select:disabled').removeClass('_disabled');
        element.removeClass('_block-content-loading');
    }

    breeze.widget('blockLoader', function (href) {
        if (!loader && !_.isEmpty(href)) {
            loader = $(_.template(template)({
                loaderImageHref: href
            }));
        }

        return {
            show: show, // @todo Promise
            hide: hide
        };
    });

    $(document).on('breeze:mount:Magento_Ui/js/block-loader', function (event) {
        $.fn.blockLoader(event.detail.settings);
    });
})();
