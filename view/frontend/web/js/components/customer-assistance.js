(function () {
    'use strict';

    $.widget('customerAssistance', {
        component: 'Magento_LoginAsCustomerAssistance/js/opt-in',

        /** Initialize plugin */
        create: function () {
            var self = this;

            //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
            this.element.on('submit', function () {
                this.elements.assistance_allowed.value =
                    this.elements.assistance_allowed_checkbox.checked ?
                        self.options.allowAccess : self.options.denyAccess;
            });
            //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
        }
    });
})();
