/* global breeze */
(function () {
    'use strict';

    $.widget('upsellProducts', {
        component: 'upsellProducts',
        options: {
            elementsSelector: '.item.product'
        },

        /** Initialize plugin */
        create: function () {
            if (this.element.data('shuffle')) {
                breeze.shuffleElements(this.element.find(this.options.elementsSelector));
            }

            breeze.revealElements(
                this.element.find(this.options.elementsSelector),
                this.element.data('limit'),
                this.element.data('shuffle-weighted')
            );
        }
    });
})();
