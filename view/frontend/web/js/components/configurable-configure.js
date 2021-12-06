/* global _ */
(function () {
    'use strict';

    $.widget('abstractConfigurableUpdater', {
        /** [create description] */
        create: function () {
            this.productOptions = {};

            this.cartSubscription = $.sections.get('cart').subscribe(function (updateCartData) {
                if (this.setProductOptions(updateCartData)) {
                    this.updateOptions();
                }
            }.bind(this));

            $('#product_addtocart_form').on(this.eventName, function () {
                this.setProductOptions($.sections.get('cart')());
                this.updateOptions();
            }.bind(this));
        },

        /** [destroy description] */
        destroy: function () {
            this.cartSubscription.dispose();
            this._super();
        },

        updateOptions: _.noop,

        /** [setProductOptions description] */
        setProductOptions: function (data) {
            var product,
                changedProductOptions,
                productId = $('#product_addtocart_form [name="product"]').val(),
                itemId = $('#product_addtocart_form [name="item"]').val();

            if (!data || !data.items || !data.items.length || !productId || !itemId) {
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
        }
    });

    $.widget('swatchUpdater', 'abstractConfigurableUpdater', {
        eventName: 'swatch.initialized',

        /** [updateOptions description] */
        updateOptions: function () {
            var swatchWidget = $('.swatch-opt').data('mageSwatchRenderer');

            if (!swatchWidget || !swatchWidget._EmulateSelectedByAttributeId) {
                return;
            }

            // timout is used to wait until price-box widget will be mounted
            setTimeout(function () {
                swatchWidget._EmulateSelectedByAttributeId(this.productOptions);
            }.bind(this), 80);
        }
    });

    $.widget('configurableUpdater', 'abstractConfigurableUpdater', {
        eventName: 'configurable.initialized',

        /** [updateOptions description] */
        updateOptions: function () {
            var configurableWidget = $('#product_addtocart_form').data('mageConfigurable');

            if (!configurableWidget) {
                return;
            }

            configurableWidget.options.values = this.productOptions || {};
            configurableWidget._configureForValues();
        }
    });

    $(document).on('breeze:load', function () {
        if (window.location.href.indexOf('checkout/cart/configure') === -1) {
            return;
        }

        $.fn.swatchUpdater();
        $.fn.configurableUpdater();
    });
})();
