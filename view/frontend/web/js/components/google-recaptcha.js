/* global grecaptcha */
(function () {
    'use strict';

    var registry = {
            ids: ko.observableArray([]),
            captchaList: ko.observableArray([]),
            tokenFields: ko.observableArray([])
        },
        reCaptchaLoader,
        nonInlineReCaptchaRenderer;

    reCaptchaLoader = {
        scriptTagAdded: false,

        /**
         * Add script tag. Script tag should be added once
         */
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

        /**
         * Add reCaptcha entity to checklist.
         *
         * @param {jQuery} reCaptchaEntity
         * @param {Object} parameters
         */
        add: function (reCaptchaEntity, parameters) {
            if (!this.initialized) {
                this.init();
                grecaptcha.render(this.rendererRecaptchaId, parameters);
                setInterval(this.resolveVisibility.bind(this), 100);
                this.initialized = true;
            }

            this.reCaptchaEntities.push(reCaptchaEntity);
        },

        /**
         * Show additional reCaptcha instance if any other should be visible, otherwise hide it.
         */
        resolveVisibility: function () {
            this.reCaptchaEntities.some(function (entity) {
                return entity.is(':visible') &&
                    // 900 is some magic z-index value of modal popups.
                    (entity.closest('[data-role=\'modal\']').length === 0 || entity.zIndex() > 900);
            }) ? this.rendererReCaptcha.show() : this.rendererReCaptcha.hide();
        },

        /**
         * Initialize additional reCaptcha instance.
         */
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

        /**
         * Loads recaptchaapi API and triggers event, when loaded
         */
        _loadApi: function () {
            if (this._isApiRegistered !== undefined) {
                if (this._isApiRegistered === true) {
                    $(window).trigger('recaptchaapiready');
                }

                return;
            }
            this._isApiRegistered = false;

            // global function
            window.globalOnRecaptchaOnLoadCallback = function () {
                this._isApiRegistered = true;
                $(window).trigger('recaptchaapiready');
            }.bind(this);

            reCaptchaLoader.addReCaptchaScriptTag();
        },

        /**
         * Checking that reCAPTCHA is invisible type
         * @returns {Boolean}
         */
        getIsInvisibleRecaptcha: function () {
            return this.settings?.invisible;
        },

        /**
         * reCAPTCHA callback
         * @param {String} token
         */
        reCaptchaCallback: function (token) {
            if (this.getIsInvisibleRecaptcha()) {
                this.tokenField.value = token;
                this.$parentForm.submit();
            }
        },

        /**
         * Initialize reCAPTCHA after first rendering
         */
        initCaptcha: function () {
            var $parentForm,
                $wrapper,
                $reCaptcha,
                widgetId,
                parameters;

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
            $wrapper = $('#' + this.getReCaptchaId() + '-wrapper');
            $reCaptcha = $wrapper.find('.g-recaptcha');
            $reCaptcha.attr('id', this.getReCaptchaId());

            $parentForm = $wrapper.parents('form');

            parameters = _.extend(
                {
                    'callback': function (token) { // jscs:ignore jsDoc
                        this.reCaptchaCallback(token);
                        this.validateReCaptcha(true);
                    }.bind(this),
                    'expired-callback': function () {
                        this.validateReCaptcha(false);
                    }.bind(this)
                },
                this.settings.rendering
            );

            if (parameters.size === 'invisible' && parameters.badge !== 'inline') {
                nonInlineReCaptchaRenderer.add($reCaptcha, parameters);
            }

            // eslint-disable-next-line no-undef
            widgetId = grecaptcha.render(this.getReCaptchaId(), parameters);
            this.initParentForm($parentForm, widgetId);

            registry.ids.push(this.getReCaptchaId());
            registry.captchaList.push(widgetId);
            registry.tokenFields.push(this.tokenField);
        },

        /**
         * Initialize parent form.
         *
         * @param {Object} parentForm
         * @param {String} widgetId
         */
        initParentForm: function (parentForm, widgetId) {
            if (this.getIsInvisibleRecaptcha() && parentForm.length > 0) {
                parentForm.on('submit', function (event) {
                    if (!this.tokenField.value) {
                        // eslint-disable-next-line no-undef
                        grecaptcha.execute(widgetId);
                        event.preventDefault(event);
                        event.stopImmediatePropagation();
                    }
                }.bind(this));

                // Create a virtual token field
                this.tokenField = $('<input type="text" name="token" style="display: none">')[0];
                this.$parentForm = parentForm;
                parentForm.append(this.tokenField);
            } else {
                this.tokenField = null;
            }

            $('#send2').prop('disabled', false);
        },

        /**
         * Validates reCAPTCHA
         * @param {*} state
         * @returns {jQuery}
         */
        validateReCaptcha: function (state) {
            if (!this.getIsInvisibleRecaptcha()) {
                return $(document).find('input[type=checkbox].required-captcha').prop('checked', state);
            }
        },

        /**
         * Render reCAPTCHA
         */
        renderReCaptcha: function () {
            if (window.grecaptcha && window.grecaptcha.render) { // Check if reCAPTCHA is already loaded
                this.initCaptcha();
            } else { // Wait for reCAPTCHA to be loaded
                $(window).on('recaptchaapiready', function () {
                    this.initCaptcha();
                }.bind(this));
            }
        },

        /**
         * Get reCAPTCHA ID
         * @returns {String}
         */
        getReCaptchaId: function () {
            return this.reCaptchaId;
        }
    });
})();
