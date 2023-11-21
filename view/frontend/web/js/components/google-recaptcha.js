/* global grecaptcha */
(function () {
    'use strict';

    var reCaptchaLoader,
        nonInlineReCaptchaRenderer;

    reCaptchaLoader = {
        scriptTagAdded: false,

        addReCaptchaScriptTag: function () {
            if (this.scriptTagAdded) {
                return;
            }

            this.scriptTagAdded = true;

            $.loadScript(
                'https://www.google.com/recaptcha/api.js' +
                '?onload=globalOnRecaptchaOnLoadCallback&render=explicit'
            );
        }
    };

    nonInlineReCaptchaRenderer = {
        initialized: false,
        reCaptchaEntities: [],
        rendererRecaptchaId: 'recaptcha-invisible',
        rendererReCaptcha: null,

        add: function (reCaptchaEntity, parameters) {
            if (!this.initialized) {
                this.init();
                grecaptcha.render(this.rendererRecaptchaId, parameters);
                setInterval(this.resolveVisibility.bind(this), 100);
                this.initialized = true;
            }

            this.reCaptchaEntities.push(reCaptchaEntity);
        },

        resolveVisibility: function () {
            this.reCaptchaEntities.some(function (entity) {
                return entity.is(':visible') &&
                    // 900 is some magic z-index value of modal popups.
                    (entity.closest('[data-role=\'modal\']').length === 0 || entity.zIndex() > 900);
            }) ? this.rendererReCaptcha.show() : this.rendererReCaptcha.hide();
        },

        init: function () {
            this.rendererReCaptcha = $('<div>').attr('id', this.rendererRecaptchaId);
            this.rendererReCaptcha.hide();
            $('body').append(this.rendererReCaptcha);
        }
    };

    $.view('googleRecaptcha', {
        component: 'Magento_ReCaptchaFrontendUi/js/reCaptcha',
        defaults: {
            template: 'Magento_ReCaptchaFrontendUi/reCaptcha',
            reCaptchaId: 'recaptcha'
        },

        create: function () {
            $.lazy(this._loadApi.bind(this));
        },

        _loadApi: function () {
            if (this._isApiRegistered !== undefined) {
                if (this._isApiRegistered === true) {
                    $(window).trigger('recaptchaapiready');
                }

                return;
            }
            this._isApiRegistered = false;

            window.globalOnRecaptchaOnLoadCallback = function () {
                this._isApiRegistered = true;
                $(window).trigger('recaptchaapiready');
            }.bind(this);

            reCaptchaLoader.addReCaptchaScriptTag();
        },

        getIsInvisibleRecaptcha: function () {
            return this.settings?.invisible;
        },

        reCaptchaCallback: function () {
            if (this.getIsInvisibleRecaptcha()) {
                this.$parentForm
                    .data('prevent-submit', false)
                    .submit()
                    .data('prevent-submit', true);
            }
        },

        resetCaptcha: function () {
            grecaptcha.reset(this.$parentForm.data('widget-id'));
        },

        initCaptcha: function () {
            var $wrapper = $('#' + this.getReCaptchaId() + '-wrapper'),
                $reCaptcha = $wrapper.find('.g-recaptcha'),
                parameters = _.extend(
                    {
                        'callback': function (token) {
                            this.reCaptchaCallback(token);
                            this.validateReCaptcha(true);
                        }.bind(this),
                        'expired-callback': function () {
                            this.resetCaptcha();
                            this.validateReCaptcha(false);
                        }.bind(this)
                    },
                    this.settings?.rendering
                );

            if (this.captchaInitialized || !this.settings) {
                return;
            }

            this.captchaInitialized = true;

            /*
             * Workaround for data-bind issue:
             * We cannot use data-bind to link a dynamic id to our component
             * See:
             * https://stackoverflow.com/questions/46657573/recaptcha-the-bind-parameter-must-be-an-element-or-id
             *
             * We create a wrapper element with a wrapping id and we inject the real ID with jQuery.
             * In this way we have no data-bind attribute at all in our reCAPTCHA div
             */
            $reCaptcha.attr('id', this.getReCaptchaId());
            this.$parentForm = $wrapper.parents('form');

            if (parameters.size === 'invisible' && parameters.badge !== 'inline') {
                nonInlineReCaptchaRenderer.add($reCaptcha, parameters);
            }

            this.initParentForm(
                this.$parentForm,
                grecaptcha.render(this.getReCaptchaId(), parameters)
            );
        },

        initParentForm: function (parentForm, widgetId) {
            if (this.getIsInvisibleRecaptcha() && parentForm.length > 0) {
                parentForm
                    .data('prevent-submit', true)
                    .data('widget-id', widgetId)
                    .on('submit', function (event) {
                        if (parentForm.data('prevent-submit')) {
                            grecaptcha.execute(widgetId);
                            event.preventDefault();
                            event.stopImmediatePropagation();
                        }
                    });
            }

            // do not change selector to #send2 as it will return first element only
            $('body #send2').prop('disabled', false);
        },

        validateReCaptcha: function (state) {
            if (!this.getIsInvisibleRecaptcha()) {
                return $(document).find('input[type=checkbox].required-captcha').prop('checked', state);
            }
        },

        renderReCaptcha: function () {
            if (window.grecaptcha && window.grecaptcha.render) {
                this.initCaptcha();
            } else {
                $(window).on('recaptchaapiready', function () {
                    this.initCaptcha();
                }.bind(this));
            }
        },

        getReCaptchaId: function () {
            return this.reCaptchaId;
        }
    });
})();
