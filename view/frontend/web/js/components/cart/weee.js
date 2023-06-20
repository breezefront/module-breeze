define([
    'uiComponent',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/model/totals'
], function (Component, quote, totals) {
    'use strict';

    Component.extend({
        component: 'Magento_Weee/js/view/checkout/summary/weee',
        parentComponent: 'Magento_Checkout/js/view/summary/abstract-total',
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

    Component.extend({
        component: 'Magento_Weee/js/view/cart/totals/weee',
        parentComponent: 'Magento_Weee/js/view/checkout/summary/weee'
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
