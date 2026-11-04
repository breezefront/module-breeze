define([
    'uiComponent',
    'mage/storage',
    'Magento_Ui/js/modal/modal',
    'Magento_Customer/js/customer-data'
], function (Component, storage, modal, customerData) {
    'use strict';

    var authenticationPopup, loginAction, loginCallbacks = [];

    loginAction = function (loginData, redirectUrl, isGlobal, messageContainer) {
        var customerLoginUrl = window.authenticationPopup?.customerLoginUrl || 'customer/ajax/login',
            addError = async (message) => {
                messageContainer = messageContainer || await require.async('Magento_Ui/js/model/messageList');
                messageContainer.addErrorMessage(message);
            };

        if (loginData.customerLoginUrl) {
            customerLoginUrl = loginData.customerLoginUrl;
            delete loginData.customerLoginUrl;
        }

        return storage.post(
            customerLoginUrl,
            JSON.stringify(loginData),
            isGlobal === undefined ? true : isGlobal
        ).done((response) => {
            if (response.errors) {
                return addError(response.message);
            }

            customerData.invalidate(['customer']);

            if (response.redirectUrl || redirectUrl) {
                window.location.href = response.redirectUrl || redirectUrl;
            } else {
                location.reload();
            }
        })
        .fail(() => addError($t('Could not authenticate. Please try again later')))
        .always(() => loginCallbacks.forEach((callback) => callback(loginData)));
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

            $(window).on('pageshow', e => {
                if (e.persisted) {
                    this.isLoading(false);
                }
            });
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
