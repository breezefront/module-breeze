/* global breeze */
(function () {
    'use strict';

    breeze.widget('productValidate', {
        /** Initialize plugin */
        init: function () {
            $(this.element).validator();
            $(this.element).catalogAddToCart(this.options);
        }
    });

    document.addEventListener('breeze:mount:Magento_Catalog/js/validate-product', function (event) {
        $(event.detail.el).productValidate(event.detail.settings);
    });
})();
