/* global ko _ */
(function () {
    'use strict';

    $(document).on('breeze:mount:Magento_LoginAsCustomerFrontendUi/js/login', function (event, data) {
        $.sections.reload($.sections.getSectionNames());
        $(document).on('customer-data-reload', function () {
            window.location.href = data.settings.redirectUrl;
        });
    });

    $.view('loginAsCustomer', {
        component: 'Magento_LoginAsCustomerFrontendUi/js/view/loginAsCustomer',
        isVisible: ko.observable(false),
        notificationText: ko.observable(),

        /** [create description] */
        create: function () {
            var customerData = $.sections.get('customer'),
                loggedAsCustomerData = $.sections.get('loggedAsCustomer');

            customerData.subscribe(function (data) {
                this.fullname = data.fullname;
                this.updateBanner();
            }.bind(this));
            loggedAsCustomerData.subscribe(function (data) {
                this.adminUserId = data.adminUserId;
                this.websiteName = data.websiteName;
                this.updateBanner();
            }.bind(this));

            this.fullname = customerData().fullname;
            this.adminUserId = loggedAsCustomerData().adminUserId;
            this.websiteName = loggedAsCustomerData().websiteName;

            this.updateBanner();
        },

        /** Update banner area */
        updateBanner: function () {
            if (this.adminUserId !== undefined) {
                this.isVisible(this.adminUserId);
            }

            if (this.fullname !== undefined && this.websiteName !== undefined) {
                this.notificationText($.__('You are connected as <strong>%1</strong> on %2')
                    .replace('%1', _.escape(this.fullname))
                    .replace('%2', _.escape(this.websiteName)));
            }
        }
    });
})();
