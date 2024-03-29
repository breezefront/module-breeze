(function () {
    'use strict';

    $.widget('mage.orderReview', {
        component: 'orderReview',
        options: {
            orderReviewSubmitSelector: '#review-button',
            shippingSelector: '#shipping_method',
            shippingSubmitFormSelector: null,
            updateOrderSelector: '#update-order',
            billingAsShippingSelector: '#billing\\:as_shipping',
            updateContainerSelector: '#details-reload',
            waitLoadingContainer: '#review-please-wait',
            shippingMethodContainer: '#shipping-method-container',
            agreementSelector: 'div.checkout-agreements input',
            isAjax: false,
            shippingMethodUpdateUrl: null,
            updateOrderSubmitUrl: null,
            canEditShippingMethod: false
        },
        triggerPropertyChange: true,
        isShippingSubmitForm: false,

        _create: function () {
            var isDisable;

            this.element
                .on('click', this.options.orderReviewSubmitSelector, $.proxy(this._submitOrder, this))
                .on('click', this.options.billingAsShippingSelector, $.proxy(this._shippingTobilling, this))
                .on('change',
                    this.options.shippingSelector,
                    $.proxy(this._submitUpdateOrder,
                        this,
                        this.options.updateOrderSubmitUrl,
                        this.options.updateContainerSelector
                    )
                )
                .find(this.options.updateOrderSelector)
                .on('click', $.proxy(this._updateOrderHandler, this));

            this._shippingTobilling();

            if ($(this.options.shippingSubmitFormSelector).length && this.options.canEditShippingMethod) {
                this.isShippingSubmitForm = true;
                $(this.options.shippingSubmitFormSelector)
                    .on('change',
                        this.options.shippingSelector,
                        $.proxy(
                            this._submitUpdateOrder,
                            this,
                            $(this.options.shippingSubmitFormSelector).prop('action'),
                            this.options.updateContainerSelector
                        )
                    );

                this._updateOrderSubmit(!$(this.options.shippingSubmitFormSelector)
                    .find(this.options.shippingSelector).val());
            } else {
                isDisable = this.isShippingSubmitForm && this.element.find(this.options.shippingSelector).val();
                this.element
                    .on('input propertychange', 'input[name]',
                        $.proxy(this._updateOrderSubmit, this, isDisable, this._onShippingChange)
                    )
                    .find('select')
                    .not(this.options.shippingSelector)
                    .on('change', this._propertyChange);

                this._updateOrderSubmit(isDisable);
            }
        },

        _ajaxBeforeSend: function () {
            this.element.find(this.options.waitLoadingContainer).show();
        },

        _ajaxComplete: function () {
            this.element.find(this.options.waitLoadingContainer).hide();
        },

        _propertyChange: function () {
            $(this).trigger('propertychange');
        },

        _updateOrderHandler: function () {
            $(this.options.shippingSelector).trigger('change');
        },

        _submitOrder: function () {
            if (this._validateForm()) {
                this.element.find(this.options.waitLoadingContainer).show();
                this.element.submit();
                this._updateOrderSubmit(true);
            }
        },

        _validateForm: function () {
            this.element.find(this.options.agreementSelector)
                .off('change')
                .on('change', $.proxy(function () {
                    var isValid = this._validateForm();

                    this._updateOrderSubmit(!isValid);
                }, this));

            if (this.element.data('mageValidation')) {
                return this.element.validation().valid();
            }

            return true;
        },

        /**
         * Check/Set whether order can be submitted
         * Also disables form submission element, if any
         * @param {*} shouldDisable - whether should prevent order submission explicitly
         * @param {Function} [fn] - function for shipping change handler
         * @param {*} [*] - if true the property change will be set to true
         */
        _updateOrderSubmit: function (shouldDisable, fn) {
            this._toggleButton(this.options.orderReviewSubmitSelector, shouldDisable);

            if (typeof fn === 'function') {
                fn.call(this);
            }
        },

        /**
         * Enable/Disable button
         * @param {jQuery} button - button selector to be toggled
         * @param {*} disable - boolean for toggling
         */
        _toggleButton: function (button, disable) {
            $(button).prop({
                    disabled: disable
                })
                .toggleClass('no-checkout', disable)
                .css('opacity', disable ? 0.5 : 1);
        },

        /**
         * Copy element value from shipping to billing address
         * @param {jQuery.Event} e - optional
         */
        _shippingTobilling: function (e) {
            var isChecked, opacity;

            if (this.options.shippingSubmitFormSelector) {
                return false;
            }
            isChecked = $(this.options.billingAsShippingSelector).is(':checked');
            opacity = isChecked ? 0.5 : 1;

            if (isChecked) {
                this.element.validation('clearError', 'input[name^="billing"]');
            }
            $('input[name^="shipping"]', this.element).each($.proxy(function (key, value) {
                var fieldObj = $(value.id.replace('shipping:', '#billing\\:'));

                if (isChecked) {
                    fieldObj = fieldObj.val($(value).val());
                }
                fieldObj.prop({
                    'readonly': isChecked,
                    'disabled': isChecked
                }).css('opacity', opacity);

                if (fieldObj.is('select')) {
                    this.triggerPropertyChange = false;
                    fieldObj.trigger('change');
                }
            }, this));

            if (isChecked || e) {
                this._updateOrderSubmit(true);
            }
            this.triggerPropertyChange = true;
        },

        /**
         * Dispatch an ajax request of Update Order submission
         * @param {*} url - url where to submit shipping method
         * @param {*} resultId - id of element to be updated
         */
        _submitUpdateOrder: function (url, resultId) {
            var isChecked, formData, callBackResponseHandler, shippingMethod;

            if (this.element.find(this.options.waitLoadingContainer).is(':visible')) {
                return false;
            }
            isChecked = $(this.options.billingAsShippingSelector).is(':checked');
            formData = null;
            callBackResponseHandler = null;
            shippingMethod = $(this.options.shippingSelector).val().trim();
            this._shippingTobilling();

            if (url && resultId && shippingMethod) {
                this._updateOrderSubmit(true);
                this._toggleButton(this.options.updateOrderSelector, true);

                // form data and callBack updated based on the shipping Form element
                if (this.isShippingSubmitForm) {
                    formData = $(this.options.shippingSubmitFormSelector).serialize() + '&isAjax=true';

                    /**
                     * @param {Object} response
                     */
                    callBackResponseHandler = function (response) {
                        $(resultId).empty().append(response);
                        this._updateOrderSubmit(false);
                        this._ajaxComplete();
                    };
                } else {
                    formData = this.element.serialize() + '&isAjax=true';

                    /**
                     * @param {Object} response
                     */
                    callBackResponseHandler = function (response) {
                        $(resultId).empty().append(response);
                        this._ajaxShippingUpdate(shippingMethod);
                    };
                }

                if (isChecked) {
                    $(this.options.shippingSelect).prop('disabled', true);
                }
                $.ajax({
                    url: url,
                    method: 'post',
                    context: this,
                    beforeSend: this._ajaxBeforeSend,
                    data: formData,
                    success: callBackResponseHandler
                });
            }
        },

        /**
         * Update Shipping Methods Element from server
         * @param {*} shippingMethod
         */
        _ajaxShippingUpdate: function (shippingMethod) {
            $.ajax({
                url: this.options.shippingMethodUpdateUrl,
                data: {
                    isAjax: true,
                    'shipping_method': shippingMethod
                },
                method: 'post',
                context: this,

                /** @inheritdoc */
                success: function (response) {
                    $(this.options.shippingMethodContainer).parent().html(response);
                    this._toggleButton(this.options.updateOrderSelector, false);
                    this._updateOrderSubmit(false);
                },
                complete: this._ajaxComplete
            });
        },

        /**
         * Actions on change Shipping Address data
         */
        _onShippingChange: function () {
            if (this.triggerPropertyChange && $(this.options.shippingSelector).val()) {
                this.element.find(this.options.shippingSelector).hide().end()
                    .find(this.options.shippingSelector + '_update').show();
            }
        }
    });
})();
