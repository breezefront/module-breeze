define([
    'Magento_Checkout/js/view/summary/abstract-total',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/model/totals'
], function (AbstractTotal, quote, totals) {
    'use strict';

    var WeeeTotal = AbstractTotal.extend({
        component: 'Magento_Weee/js/view/checkout/summary/weee',
        defaults: {
            template: 'Magento_Weee/checkout/summary/weee'
        },
        isIncludedInSubtotal: window.checkoutConfig.isIncludedInSubtotal,

        getWeeeTaxSegment: function () {
            var weee = totals.getSegment('weee_tax') || totals.getSegment('weee');

            return weee?.value || 0;
        },

        getValue: function () {
            return this.getFormattedPrice(this.getWeeeTaxSegment());
        },

        isDisplayed: function () {
            return this.getWeeeTaxSegment() > 0;
        }
    });

    WeeeTotal.extend({
        component: 'Magento_Weee/js/view/cart/totals/weee'
    });

    $.widget('taxToggle', {
        component: 'taxToggle',
        create: function () {
            this._on('click', this.toggle);
        },
        toggle: function () {
            this.element.toggleClass(this.options.expandedClassName || 'cart-tax-total-expanded');
            $(this.options.itemTaxId).toggle();
        }
    });
});
