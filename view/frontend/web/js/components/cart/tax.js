define([
    'uiComponent',
    'Magento_Checkout/js/model/quote',
], function (Component, quote) {
    'use strict';

    Component.extend({
        component: 'Magento_Tax/js/view/checkout/summary/subtotal',
        parentComponent: 'Magento_Checkout/js/view/summary/abstract-total',
        defaults: {
            displaySubtotalMode: window.checkoutConfig.reviewTotalsDisplayMode,
            template: 'Magento_Tax/checkout/summary/subtotal'
        },
        totals: quote.getTotals(),

        getValue: function () {
            return this.getFormattedPrice(this.totals().subtotal || 0);
        },

        isBothPricesDisplayed: function () {
            return this.displaySubtotalMode === 'both';
        },

        isIncludingTaxDisplayed: function () {
            return this.displaySubtotalMode === 'including';
        },

        getValueInclTax: function () {
            return this.getFormattedPrice(this.totals()?.subtotal_incl_tax || 0);
        }
    });

    Component.extend({
        component: 'Magento_Tax/js/view/checkout/summary/shipping',
        parentComponent: 'Magento_Checkout/js/view/summary/shipping',
        defaults: {
            displayMode: window.checkoutConfig.reviewShippingDisplayMode,
            template: 'Magento_Tax/checkout/summary/shipping'
        },

        isBothPricesDisplayed: function () {
            return this.displayMode === 'both';
        },

        isIncludingDisplayed: function () {
            return this.displayMode === 'including';
        },

        isExcludingDisplayed: function () {
            return this.displayMode === 'excluding';
        },

        getIncludingValue: function () {
            if (!this.isCalculated()) {
                return this.notCalculatedMessage;
            }

            return this.getFormattedPrice(this.totals().shipping_incl_tax);
        },

        getExcludingValue: function () {
            if (!this.isCalculated()) {
                return this.notCalculatedMessage;
            }

            return this.getFormattedPrice(this.totals().shipping_amount);
        }
    });

    Component.extend({
        component: 'Magento_Tax/js/view/checkout/cart/totals/shipping',
        parentComponent: 'Magento_Tax/js/view/checkout/summary/shipping',
        isCalculated: () => !!quote.shippingMethod(),
        getShippingMethodTitle: function () {
            return '(' + this._super() + ')';
        }
    });
});
