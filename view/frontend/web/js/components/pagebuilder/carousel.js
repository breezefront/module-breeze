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

            this.element.pagebuilderSlider('instance').slides.hover(
                () => {
                    this.element.addClass('slide-item-hovered');
                },
                () => {
                    this.element.removeClass('slide-item-hovered');
                }
            );
        }
    });
})();
