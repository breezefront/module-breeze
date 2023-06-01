define([
    'uiComponent',
    'Magento_Ui/js/modal/modal',
    'Magento_Customer/js/customer-data'
], function (Component, modal, customerData) {
    'use strict';

    Component.extend({
        component: 'Magento_Customer/js/view/authentication-popup',
        defaults: {
            template: 'Magento_Customer/authentication-popup',
            registerUrl: window.authenticationPopup.customerRegisterUrl,
            forgotPasswordUrl: window.authenticationPopup.customerForgotPasswordUrl,
            autocomplete: window.authenticationPopup.autocomplete,
            isLoading: ko.observable(false)
        },

        isActive: () => !customerData.get('customer')(),

        setModalElement: function (element) {
            if (this.modalWindow) {
                return;
            }

            this.modalWindow = element;

            modal({
                'modalClass': 'popup-authentication',
                'focus': '[name=username]',
                'trigger': '.proceed-to-checkout',
                'buttons': []
            }, $(this.modalWindow));
        },

        showModal: function () {
            $(this.modalWindow).modal('openModal').trigger('contentUpdated');
        },

        login: function (component, event) {
            var formElement = $(event.currentTarget),
                loginData = formElement.serializeJSON();

            if (formElement.data('prevent-submit')
                || !formElement.validation()
                || !formElement.validation('isValid')
            ) {
                return false;
            }

            this.isLoading(true);

            $.post(window.authenticationPopup.customerLoginUrl, {
                data: loginData,
                done: (response) => {
                    if (response.errors) {
                        return $.registry.first('uiMessages').removeAll().addErrorMessage(response.message);
                    }

                    customerData.invalidate(['customer']);

                    if (response.redirectUrl) {
                        window.location.href = response.redirectUrl;
                    } else {
                        location.reload();
                    }
                },
                fail: () => {
                    $.registry.first('uiMessages').removeAll().addErrorMessage(
                        $t('Could not authenticate. Please try again later')
                    );
                },
                always: () => {
                    this.isLoading(false);
                    this._trigger('afterLogin', {
                        loginData: loginData
                    });
                }
            });
        }
    });
});
