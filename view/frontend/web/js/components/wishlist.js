(function () {
    'use strict';

    $.view('view.wishlist', {
        component: 'Magento_Wishlist/js/view/wishlist',
        wishlist: $.sections.get('wishlist')
    });

    $.widget('wishlist', {
        component: 'wishlist',
        options: {
            dataAttribute: 'item-id',
            nameFormat: 'qty[{0}]',
            qtySelector: '[data-role=qty]'
        },

        /** Initialize plugin */
        create: function () {
            this._on({
                'click [data-role=tocart]': '_beforeAddToCart',
                'click [data-role=all-tocart]': '_addAllWItemsToCart'
            });
        },

        /**
         * Process data before add to cart
         *
         * - update item's qty value.
         *
         * @param {Event} event
         * @private
         */
        _beforeAddToCart: function (event) {
            var elem = $(event.currentTarget),
                itemId = elem.data(this.options.dataAttribute),
                qtyName = this.options.nameFormat.replace('{0}', itemId),
                qtyValue = elem.parents().find('[name="' + qtyName + '"]').val(),
                params = elem.data('post');

            if (params) {
                params.data = $.extend({}, params.data, {
                    'qty': qtyValue
                });
                elem.data('post', params);
            }
        },

        /**
         * Add all wish list items to cart
         * @private
         */
        _addAllWItemsToCart: function () {
            var urlParams = this.options.addAllToCartUrl,
                separator = urlParams.action.indexOf('?') >= 0 ? '&' : '?';

            this.element.find(this.options.qtySelector).each(function (index, element) {
                urlParams.action += separator + $(element).prop('name') + '=' + encodeURIComponent($(element).val());
                separator = '&';
            });

            $.mage.dataPost().postData(urlParams);
        }
    });
})();
