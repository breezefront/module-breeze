(function () {
    'use strict';

    $.widget('pagebuilderCarousel', {
        component: 'Magento_PageBuilder/js/content-type/products/appearance/carousel/widget',

        /** [create description] */
        create: function () {
            var slider = this.element.find('.slick-list'),
                timer;

            this.element.pagebuilderSlider($.extend({}, this.options, {
                slider: slider.length ? slider : this.element.children()
            }));

            this._on({
                'mouseenter .product-item': () => {
                    this.element.addClass('slide-item-hovered');
                },
                'mouseleave .product-item': () => {
                    this.element.removeClass('slide-item-hovered');
                }
            });

            // prevent laggy scrolling when using touchpad and scrolling a lot
            this._on(this.slider().slider, {
                scroll: () => {
                    this.element.addClass('scrolling');

                    if (timer) {
                        clearTimeout(timer);
                    }

                    timer = setTimeout(() => {
                        this.element.removeClass('scrolling');
                    }, 200);
                }
            });
        },

        /** [slider description] */
        slider: function () {
            return this.element.pagebuilderSlider('instance');
        }
    });
})();
