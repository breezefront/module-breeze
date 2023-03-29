(function () {
    'use strict';

    $.widget('customerAssistance', {
        component: 'Magento_LoginAsCustomerAssistance/js/opt-in',

        create: function () {
            var self = this;

            this.element.on('submit', function () {
                this.elements.assistance_allowed.value =
                    this.elements.assistance_allowed_checkbox.checked ?
                        self.options.allowAccess : self.options.denyAccess;
            });
        }
    });
})();
