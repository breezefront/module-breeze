/* global _ ko */
(function () {
    'use strict';

    $.view('lastOrderedItems', {
        component: 'Magento_Sales/js/view/last-ordered-items',
        defaults: {
            isShowAddToCart: false
        },

        /** [create description] */
        create: function () {
            this.isShowAddToCart = ko.observable(this.isShowAddToCart);
            this.lastOrderedItems = $.customerData.get('last-ordered-items');
            this.lastOrderedItems.subscribe(this.checkSalableItems.bind(this));
            this.checkSalableItems();

            return this;
        },

        /** [checkSalableItems description] */
        checkSalableItems: function () {
            var isShowAddToCart = _.some(this.lastOrderedItems().items, {
                'is_saleable': true
            });

            this.isShowAddToCart(isShowAddToCart);
        }
    });
})();
