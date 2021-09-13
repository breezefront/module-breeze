(function () {
    'use strict';

    $.widget('pagebuilderCarousel', {
        component: 'Magento_PageBuilder/js/content-type/products/appearance/carousel/widget',

        /** [create description] */
        create: function () {
            var slider = this.element.find('.slick-list');

            this.element.pagebuilderSlider($.extend({}, this.options, {
                slider: slider.length ? slider : this.element.children()
            }));
        }
    });
})();
