define([
    'uiComponent',
    'Magento_Ui/js/modal/modal',
    'Magento_Customer/js/customer-data'
], function (Component, modal, customerData) {
    'use strict';

    var authenticationPopup, loginAction, loginCallbacks = [];

    loginAction = async function (loginData, redirectUrl, isGlobal, messageContainer) {
        messageContainer = messageContainer || await require.async('Magento_Ui/js/model/messageList');

        return $.post({
            url: window.authenticationPopup.customerLoginUrl,
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

    authenticationPopup = $.breezemap['Magento_Customer/js/model/authentication-popup'] = {
        modalWindow: null,

        createPopUp: function (element) {
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
            $(this.modalWindow || '#authenticationPopup').authPopup('showModal');
        }
    };

    $.view('authPopup', {
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

        _applyBindings: async function (element, force) {
            if (force && !this.applied) {
                this.applied = true;
                return this._super(element);
            }
        },

        isActive: () => !customerData.get('customer')(),

        setModalElement: function (element) {
            if (!this.modalWindow) {
                this.modalWindow = element;
                this.createPopup(element);
            }
        },

        createPopup: function (element) {
            if (!authenticationPopup.modalWindow) {
                authenticationPopup.createPopUp(element);
            }
        },

        showModal: async function () {
            await this._applyBindings(this.el[0], true);
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
