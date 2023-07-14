define([
    'uiComponent',
    'Magento_Ui/js/modal/modal',
    'Magento_Customer/js/customer-data'
], function (Component, modal, customerData) {
    'use strict';

    var loginAction, loginCallbacks = [];

    loginAction = function (loginData, redirectUrl, isGlobal, messageContainer) {
        messageContainer = messageContainer || $.registry.first('uiMessages');

        return $.post(window.authenticationPopup.customerLoginUrl, {
            data: JSON.stringify(loginData),
            global: isGlobal === undefined ? true : isGlobal,
            done: (response) => {
                if (response.errors) {
                    return messageContainer.addErrorMessage(response.message);
                }

                customerData.invalidate(['customer']);

                if (response.redirectUrl || redirectUrl) {
                    window.location.href = response.redirectUrl || redirectUrl;
                } else {
                    location.reload();
                }
            },
            fail: () => messageContainer.addErrorMessage($t('Could not authenticate. Please try again later')),
            always: () => loginCallbacks.forEach((callback) => callback(loginData))
        });
    };
    loginAction.registerLoginCallback = (callback) => loginCallbacks.push(callback);
    $.breezemap['Magento_Customer/js/action/login'] = loginAction;
    $(document).on('breeze:destroy', () => (loginCallbacks = []) && true);

    Component.extend({
        component: 'Magento_Customer/js/view/authentication-popup',
        defaults: {
            template: 'Magento_Customer/authentication-popup',
            registerUrl: window.authenticationPopup?.customerRegisterUrl,
            forgotPasswordUrl: window.authenticationPopup?.customerForgotPasswordUrl,
            autocomplete: window.authenticationPopup?.autocomplete,
            isLoading: ko.observable(false)
        },

        create: function () {
            loginAction.registerLoginCallback(() => this.isLoading(false));
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

            $(this.modalWindow).on('modal:opened', () => {
                $(this.modalWindow).trigger('contentUpdated');
            });
        },

        showModal: function () {
            $(this.modalWindow).modal('openModal');
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

            loginAction(loginData);
        }
    });
});
