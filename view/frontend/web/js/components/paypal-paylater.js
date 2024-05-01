(() => {
    'use strict';

    $.mixin('Magento_Paypal/js/view/paylater', {
        initialize: function (parent) {
            this.amountComponentConfig.name = `${this.name}.amountProvider`;
            this.amountComponentConfig.parentName = this.name;
            return parent();
        }
    });
})();
