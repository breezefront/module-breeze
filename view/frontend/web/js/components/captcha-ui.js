define([
    'uiComponent',
    'mage/url',
    'Magento_Customer/js/customer-data',
    'Magento_Customer/js/action/login'
], (Component, urlBuilder, customerData, loginAction) => {
    'use strict';

    var Captcha, captchaList, DefaultCaptcha;

    Captcha = function (captchaData) {
        var formId = captchaData.formId,
            isCaseSensitive = captchaData.isCaseSensitive,
            imageHeight = captchaData.imageHeight,
            refreshUrl = captchaData.refreshUrl,
            imageSource = ko.observable(captchaData.imageSrc),
            visibility = ko.observable(false),
            captchaValue = ko.observable(null),
            isRequired = ko.observable(captchaData.isRequired),
            isLoading = ko.observable(false);

        return {
            formId: formId,
            imageSource: imageSource,
            visibility: visibility,
            captchaValue: captchaValue,
            isRequired: isRequired,
            isCaseSensitive: isCaseSensitive,
            imageHeight: imageHeight,
            refreshUrl: refreshUrl,
            isLoading: isLoading,
            timestamp: null,
            getFormId: () => formId,
            setFormId: id => (formId = id) && true,
            getIsVisible: () => visibility(),
            setIsVisible: flag => visibility(flag),
            getIsRequired: () => isRequired(),
            setIsRequired: flag => isRequired(flag),
            getIsCaseSensitive: () => isCaseSensitive,
            setIsCaseSensitive: flag => (isCaseSensitive = flag) && true,
            getImageHeight: () => imageHeight,
            setImageHeight: height => (imageHeight = height) && true,
            getImageSource: () => imageSource(),
            setImageSource: src => imageSource(src),
            getRefreshUrl: () => refreshUrl,
            setRefreshUrl: url => (refreshUrl = url) && true,
            getCaptchaValue: () => captchaValue(),
            setCaptchaValue: value => captchaValue(value),
            refresh: function () {
                this.isLoading(true);

                $.post({
                    url: urlBuilder.build(this.getRefreshUrl()),
                    data: JSON.stringify({
                        formId: this.getFormId()
                    }),
                    global: false,
                    done: (response) => {
                        if (response.imgSrc) {
                            this.setImageSource(response.imgSrc);
                        }
                    },
                    always: () => this.isLoading(false)
                });
            }
        };
    };

    captchaList = (() => {
        var list = [];

        $(document).on('breeze:destroy', () => {
            list = [];
        });

        return {
            add: (item) => list.push(item),
            getCaptchaByFormId: formId => list.find(item => item.formId === formId),
            getCaptchaList: () => list
        };
    })();

    DefaultCaptcha = Component.extend({
        component: 'Magento_Captcha/js/view/checkout/defaultCaptcha',
        defaults: {
            template: 'Magento_Captcha/checkout/captcha',
            dataScope: 'global',
            currentCaptcha: null,
            subscribedFormIds: [],
            captchaSubscriptions: []
        },

        initialize: function () {
            $.each(window[this.configSource]?.captcha || {}, function (formId, captchaData) {
                var captcha = Captcha(_.extend(captchaData, {
                    formId: formId
                }));

                this.checkCustomerData(formId, customerData.get('captcha')(), captcha);
                this.subscribeCustomerData(formId, captcha);
                captchaList.add(captcha);
            }.bind(this));
        },

        destroy: function () {
            this.captchaSubscriptions.map(subscription => subscription.dispose());
            this.captchaSubscriptions = [];
            this.subscribedFormIds = [];
            this._super();
        },

        checkCustomerData: function (formId, captchaData, captcha) {
            if (!_.isEmpty(captchaData) &&
                !_.isEmpty(captchaData[formId]) &&
                captchaData[formId].timestamp > captcha.timestamp
            ) {
                if (!captcha.isRequired() && captchaData[formId].isRequired) {
                    captcha.refresh();
                }
                captcha.isRequired(captchaData[formId].isRequired);
                captcha.timestamp = captchaData[formId].timestamp;
            }
        },

        subscribeCustomerData: function (formId, captcha) {
            if (this.subscribedFormIds.includes(formId)) {
                return;
            }

            this.subscribedFormIds.push(formId);
            this.captchaSubscriptions.push(customerData.get('captcha').subscribe(captchaData => {
                this.checkCustomerData(formId, captchaData, captcha);
            }));
        },

        captchaValue: function () {
            return this.currentCaptcha.getCaptchaValue();
        },

        getIsLoading: function () {
            return this.currentCaptcha?.isLoading;
        },

        getCurrentCaptcha: function () {
            return this.currentCaptcha;
        },

        setCurrentCaptcha: function (captcha) {
            this.currentCaptcha = captcha;
        },

        getFormId: function () {
            return this.currentCaptcha?.getFormId();
        },

        getIsVisible: function () {
            return this.currentCaptcha?.getIsVisible();
        },

        setIsVisible: function (flag) {
            this.currentCaptcha.setIsVisible(flag);
        },

        isRequired: function () {
            return this.currentCaptcha?.getIsRequired();
        },

        setIsRequired: function (flag) {
            this.currentCaptcha.setIsRequired(flag);
        },

        isCaseSensitive: function () {
            return this.currentCaptcha?.getIsCaseSensitive();
        },

        imageHeight: function () {
            return this.currentCaptcha?.getImageHeight();
        },

        getImageSource: function () {
            return this.currentCaptcha?.getImageSource();
        },

        refresh: function () {
            this.currentCaptcha.refresh();
        }
    });

    DefaultCaptcha.extend({
        component: 'Magento_Captcha/js/view/checkout/loginCaptcha',
        initialize: function () {
            var currentCaptcha;

            this._super();

            currentCaptcha = captchaList.getCaptchaByFormId(this.formId);

            if (currentCaptcha) {
                currentCaptcha.setIsVisible(true);
                this.setCurrentCaptcha(currentCaptcha);
                loginAction.registerLoginCallback(loginData => {
                    if (loginData.captcha_form_id === this.formId && this.isRequired()) {
                        this.refresh();
                    }
                });
            }
        }
    });
});
