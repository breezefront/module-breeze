(function () {
    'use strict';

    $.widget('pagebuilderCarousel', {
        component: 'Magento_PageBuilder/js/content-type/products/appearance/carousel/widget',

        /** [create description] */
        create: function () {
            this.element.pagebuilderSlider($.extend({}, this.options, {
                slider: this.element.children()
            }));
        }
    });
})();
