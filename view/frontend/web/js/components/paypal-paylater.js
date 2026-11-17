(() => {
    'use strict';

    $.mixin('Magento_Paypal/js/view/paylater', {
        initialize: function (parent) {
            $.registry.delete(this.amountComponentConfig.name, document.body);
            return parent();
        },

        afterRender: function () {
            this._refreshMessages();
            $.registry.get(this.amountComponentConfig.name, document.body)?._updateAmount();
        }
    });
})();
