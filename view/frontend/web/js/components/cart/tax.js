define([
    'uiComponent',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/model/totals'
], function (Component, quote, totals) {
    'use strict';

    Component.extend({
        component: 'Magento_Tax/js/view/checkout/summary/subtotal',
        parentComponent: 'Magento_Checkout/js/view/summary/abstract-total',
        defaults: {
            displaySubtotalMode: window.checkoutConfig.reviewTotalsDisplayMode,
            template: 'Magento_Tax/checkout/summary/subtotal'
        },

        getValue: function () {
            return this.getFormattedPrice(this.totals()?.subtotal || 0);
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

            return this.getFormattedPrice(this.totals()?.shipping_incl_tax);
        },

        getExcludingValue: function () {
            if (!this.isCalculated()) {
                return this.notCalculatedMessage;
            }

            return this.getFormattedPrice(this.totals()?.shipping_amount);
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

    Component.extend({
        component: 'Magento_Tax/js/view/checkout/summary/grand-total',
        parentComponent: 'Magento_Checkout/js/view/summary/abstract-total',
        defaults: {
            isFullTaxSummaryDisplayed: window.checkoutConfig.isFullTaxSummaryDisplayed || false,
            isTaxDisplayedInGrandTotal: window.checkoutConfig.includeTaxInGrandTotal || false,
            template: 'Magento_Tax/checkout/summary/grand-total'
        },

        isDisplayed: () => true,

        getValue: function () {
            return this.getFormattedPrice(this.totals()?.grand_total || 0);
        },

        getBaseValue: function () {
            return this.getFormattedPrice(this.totals()?.base_grand_total || 0);
        },

        getGrandTotalExclTax: function () {
            var total = this.totals();

            if (!total) {
                return 0;
            }

            return this.getFormattedPrice(Math.max(0, total.grand_total - total.tax_amount));
        },

        isBaseGrandTotalDisplayNeeded: function () {
            var total = this.totals();

            if (!total) {
                return false;
            }

            return total.base_currency_code !== total.quote_currency_code;
        }
    });

    Component.extend({
        component: 'Magento_Tax/js/view/checkout/cart/totals/grand-total',
        parentComponent: 'Magento_Tax/js/view/checkout/summary/grand-total',
        isDisplayed: () => true
    });

    Component.extend({
        component: 'Magento_Tax/js/view/checkout/summary/tax',
        parentComponent: 'Magento_Checkout/js/view/summary/abstract-total',
        defaults: {
            isTaxDisplayedInGrandTotal: window.checkoutConfig.includeTaxInGrandTotal,
            isFullTaxSummaryDisplayed: window.checkoutConfig.isFullTaxSummaryDisplayed,
            notCalculatedMessage: $t('Not yet calculated'),
            template: 'Magento_Tax/checkout/summary/tax'
        },

        ifShowValue: function () {
            return this.getPureValue() || window.checkoutConfig.isZeroTaxDisplayed;
        },

        ifShowDetails: function () {
            return this.getPureValue() && this.isFullTaxSummaryDisplayed;
        },

        getPureValue: function () {
            return totals.getSegment('tax')?.value || 0;
        },

        isCalculated: function () {
            return totals.getSegment('tax');
        },

        getValue: function () {
            if (!this.isCalculated()) {
                return this.notCalculatedMessage;
            }

            return this.getFormattedPrice(totals.getSegment('tax')?.value || 0);
        },

        formatPrice: function (amount) {
            return this.getFormattedPrice(amount);
        },

        getTaxAmount: function (parent, percentage) {
            var totalPercentage = 0;

            _.each(parent.rates, function (rate) {
                totalPercentage += parseFloat(rate.percent);
            });

            return this.getFormattedPrice(this.getPercentAmount(parent.amount, totalPercentage, percentage));
        },

        getPercentAmount: function (amount, totalPercentage, percentage) {
            return parseFloat(amount * percentage / totalPercentage);
        },

        getDetails: function () {
            var taxSegment = totals.getSegment('tax');

            if (taxSegment && taxSegment.extension_attributes) {
                return taxSegment.extension_attributes.tax_grandtotal_details;
            }

            return [];
        }
    });

    Component.extend({
        component: 'Magento_Tax/js/view/checkout/cart/totals/tax',
        parentComponent: 'Magento_Tax/js/view/checkout/summary/tax'
    });
});
