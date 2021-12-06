/* global _ */
(function () {
    'use strict';

    var productId,
        itemId,
        cartData,
        Updater;

    if (window.location.href.indexOf('checkout/cart/configure') === -1) {
        return;
    }

    productId = $('#product_addtocart_form [name="product"]').val();
    itemId = $('#product_addtocart_form [name="item"]').val();
    cartData = $.sections.get('cart');

    /** [Updater description] */
    Updater = function (eventName, updateOptionsCallback) {
        this.eventName = eventName;
        this.updateOptions = updateOptionsCallback;
        this.productOptions = {};
    };

    Updater.prototype = {
        /** [setProductOptions description] */
        setProductOptions: function (data) {
            var product,
                changedProductOptions;

            if (!data || !data.items || !data.items.length || !productId) {
                return;
            }

            product = _.find(data.items, function (item) {
                return item.item_id === itemId && item.product_id === productId;
            });

            if (!product || !product.options) {
                return;
            }

            changedProductOptions = product.options.reduce(function (obj, val) {
                obj[val.option_id] = val.option_value;

                return obj;
            }, {});

            if (JSON.stringify(this.productOptions || {}) === JSON.stringify(changedProductOptions || {})) {
                return false;
            }

            this.productOptions = changedProductOptions;

            return true;
        },

        /** [listen description] */
        listen: function () {
            cartData.subscribe(function (updateCartData) {
                if (this.setProductOptions(updateCartData)) {
                    this.updateOptions();
                }
            }.bind(this));

            $('#product_addtocart_form').on(this.eventName, function () {
                this.setProductOptions(cartData());
                this.updateOptions();
            }.bind(this));
        }
    };

    // colorswatches
    new Updater('swatch.initialized', function () {
        var swatchWidget = $('.swatch-opt').data('mageSwatchRenderer');

        if (!swatchWidget || !swatchWidget._EmulateSelectedByAttributeId) {
            return;
        }

        // timout is used to wait until price-box widget will be mounted
        setTimeout(function () {
            swatchWidget._EmulateSelectedByAttributeId(this.productOptions);
        }.bind(this), 80);
    }).listen();

    // configurable options
    new Updater('configurable.initialized', function () {
        var configurableWidget = $('#product_addtocart_form').data('mageConfigurable');

        if (!configurableWidget) {
            return;
        }

        configurableWidget.options.values = this.productOptions || {};
        configurableWidget._configureForValues();
    }).listen();
})();
