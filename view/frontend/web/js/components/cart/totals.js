define([
    'jquery',
    'uiComponent',
    'Magento_Catalog/js/price-utils',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/model/totals'
], function ($, Component, priceUtils, quote, totals) {
    'use strict';

    var AbstractTotal, DiscountTotal;

    Component.extend({
        component: 'Magento_Checkout/js/view/cart/totals',
        isLoading: totals.isLoading
    });

    AbstractTotal = Component.extend({
        component: 'Magento_Checkout/js/view/summary/abstract-total',
        getFormattedPrice: (price) => priceUtils.formatPriceLocale(price, quote.getPriceFormat()),
        totals: quote.getTotals()
    });

    AbstractTotal.extend({
        component: 'Magento_Checkout/js/view/summary/shipping',
        defaults: {
            template: 'Magento_Checkout/summary/shipping'
        },
        quoteIsVirtual: quote.isVirtual(),

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
            return this.totals().coupon_code && !this.totals()?.discount_amount;
        },

        getCouponDescription: function () {
            if (!this.haveToShowCoupon()) {
                return '';
            }

            return '(' + this.totals().coupon_code + ')';
        }
    });

    DiscountTotal = AbstractTotal.extend({
        component: 'Magento_SalesRule/js/view/summary/discount',
        defaults: {
            template: 'Magento_SalesRule/summary/discount'
        },

        isDisplayed: function () {
            return this.getPureValue();
        },

        getCouponCode: function () {
            return this.totals()?.coupon_code;
        },

        getCouponLabel: function () {
            return this.totals()?.coupon_label;
        },

        getTitle: function () {
            return totals.getSegment('discount')?.title;
        },

        getPureValue: function () {
            return parseFloat(this.totals()?.discount_amount || 0);
        },

        getValue: function () {
            return this.getFormattedPrice(this.getPureValue());
        }
    });

    DiscountTotal.extend({
        component: 'Magento_SalesRule/js/view/cart/totals/discount',
        defaults: {
            template: 'Magento_SalesRule/cart/totals/discount'
        }
    });
});
