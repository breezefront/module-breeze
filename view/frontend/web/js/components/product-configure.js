/* global _ */
(function () {
    'use strict';

    var productId,
        itemId,
        qtyField,
        cartData;

    if (window.location.href.indexOf('checkout/cart/configure') === -1) {
        return;
    }

    productId = $('#product_addtocart_form [name="product"]').val();
    itemId = $('#product_addtocart_form [name="item"]').val();
    qtyField = $('#product_addtocart_form [name="qty"]');
    cartData = $.sections.get('cart');

    /** Sync qty field value with data */
    function syncQuantity(data) {
        var product;

        if (!data || !data.items || !data.items.length || !productId) {
            return;
        }

        product = _.find(data.items, function (item) {
            return item.item_id === itemId && item.product_id === productId;
        });

        qtyField.val(product.qty);
    }

    cartData.subscribe(function (data) {
        syncQuantity(data);
    });

    syncQuantity(cartData());
})();
