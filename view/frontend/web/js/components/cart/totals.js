define([
    'jquery',
    'uiComponent',
    'Magento_Catalog/js/price-utils',
    'Magento_Checkout/js/model/quote',
    'Swissup_Breeze/js/components/cart/estimation-services'
], function ($, Component, priceUtils, quote, estimation) {
    'use strict';

    Component.extend({
        component: 'Magento_Checkout/js/view/cart/totals',
        isLoading: estimation.isLoading('totals')
    });

    Component.extend({
        component: 'Magento_Checkout/js/view/summary/abstract-total',
        getFormattedPrice: (price) => priceUtils.formatPriceLocale(price, quote.getPriceFormat())
    });

    Component.extend({
        component: 'Magento_Checkout/js/view/summary/shipping',
        parentComponent: 'Magento_Checkout/js/view/summary/abstract-total',
        defaults: {
            template: 'Magento_Checkout/summary/shipping'
        },
        quoteIsVirtual: quote.isVirtual(),
        totals: quote.getTotals(),

        getShippingMethodTitle: function () {
            var shippingMethod,
                shippingMethodTitle = '';

            if (!this.isCalculated()) {
                return '';
            }
            shippingMethod = quote.shippingMethod();

            if (!_.isArray(shippingMethod) && !_.isObject(shippingMethod)) {
                return '';
            }

            if (typeof shippingMethod.method_title !== 'undefined') {
                shippingMethodTitle = ' - ' + shippingMethod.method_title;
            }

            return shippingMethodTitle ?
                shippingMethod.carrier_title + shippingMethodTitle :
                shippingMethod.carrier_title;
        },

        isCalculated: function () {
            return this.totals() && quote.shippingMethod();
        },

        getValue: function () {
            if (!this.isCalculated()) {
                return this.notCalculatedMessage;
            }

            return this.getFormattedPrice(this.totals().shipping_amount);
        },

        haveToShowCoupon: function () {
            // eslint-disable-next-line max-len
            return this.totals().coupon_code;// && !discountView().isDisplayed(); //Magento_SalesRule/js/view/summary/discount
        },

        getCouponDescription: function () {
            if (!this.haveToShowCoupon()) {
                return '';
            }

            return '(' + this.totals().coupon_code + ')';
        }
    });
});
