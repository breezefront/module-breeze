define([
    'jquery',
    'validation',
    'catalogAddToCart'
], ($) => {
    'use strict';

    $.widget('productValidate', {
        component: 'Magento_Catalog/js/validate-product',

        create: function () {
            this.element.validator();
            this.element.catalogAddToCart(this.options);
        }
    });
});
