define([
    'Magento_Checkout/js/view/summary/abstract-total',
    'Magento_Checkout/js/view/summary/shipping',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/model/totals'
], function (AbstractTotal, ShippingTotal, quote, totals) {
    'use strict';

    var ShippingSummary, GrandTotalSummary, TaxSummary,
        config = window.checkoutConfig || {};

    AbstractTotal.extend({
        component: 'Magento_Tax/js/view/checkout/summary/subtotal',
        defaults: {
            displaySubtotalMode: config.reviewTotalsDisplayMode,
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

    ShippingSummary = ShippingTotal.extend({
        component: 'Magento_Tax/js/view/checkout/summary/shipping',
        defaults: {
            displayMode: config.reviewShippingDisplayMode,
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

    ShippingSummary.extend({
        component: 'Magento_Tax/js/view/checkout/cart/totals/shipping',
        isCalculated: () => !!quote.shippingMethod(),
        getShippingMethodTitle: function () {
            return '(' + this._super() + ')';
        }
    });

    GrandTotalSummary = AbstractTotal.extend({
        component: 'Magento_Tax/js/view/checkout/summary/grand-total',
        defaults: {
            isFullTaxSummaryDisplayed: config.isFullTaxSummaryDisplayed || false,
            isTaxDisplayedInGrandTotal: config.includeTaxInGrandTotal || false,
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

    GrandTotalSummary.extend({
        component: 'Magento_Tax/js/view/checkout/cart/totals/grand-total',
        isDisplayed: () => true
    });

    TaxSummary = AbstractTotal.extend({
        component: 'Magento_Tax/js/view/checkout/summary/tax',
        defaults: {
            isTaxDisplayedInGrandTotal: config.includeTaxInGrandTotal,
            isFullTaxSummaryDisplayed: config.isFullTaxSummaryDisplayed,
            notCalculatedMessage: $t('Not yet calculated'),
            template: 'Magento_Tax/checkout/summary/tax'
        },

        ifShowValue: function () {
            return this.getPureValue() || config.isZeroTaxDisplayed;
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

    TaxSummary.extend({
        component: 'Magento_Tax/js/view/checkout/cart/totals/tax'
    });
});
