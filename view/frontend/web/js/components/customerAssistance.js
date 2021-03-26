/* global breeze */
(function () {
    'use strict';

    breeze.widget('customerAssistance', {
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

    $(document).on('breeze:mount:Magento_LoginAsCustomerAssistance/js/opt-in', function (event) {
        $(event.detail.el).customerAssistance(event.detail.settings);
    });
})();
