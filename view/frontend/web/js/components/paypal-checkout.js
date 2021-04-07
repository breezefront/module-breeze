/* global breeze */
(function () {
    'use strict';

    breeze.widget('paypalCheckout', {
        options: {
            productId: 'input[type="hidden"][name="product"]',
            ppCheckoutSelector: '[data-role=pp-checkout-url]',
            ppCheckoutInput: '<input type="hidden" data-role="pp-checkout-url" name="return_url" value=""/>'
        },

        /** Init widget */
        create: function () {
            this.agreements = breeze.sections.get('paypal-billing-agreement');
            this.onClickHandler = this.onClick.bind(this);
            this.element.on('click', '[data-action="checkout-form-submit"]', this.onClickHandler);
        },

        /** Destroy widget listeners */
        destroy: function () {
            this.element.off('click', this.onClickHandler);
        },

        /** [onClick description] */
        onClick: function (event) {
            var target = $(event.target),
                returnUrl = target.data('checkout-url'),
                form = target.closest('form'),
                productId = form.find(this.options.productId).val(),
                originalForm = productId ? form : false;

            event.preventDefault();

            if (productId && !form.attr('action').length) {
                originalForm = $('form[action*="/"]')
                    .has('input[name="product"][value="%1"]'.replace('%1', productId));
            }

            if (this.agreements().askToCreate && confirm(this.agreements().confirmMessage)) { // eslint-disable-line
                this.redirect(this.agreements().confirmUrl, originalForm);
            } else {
                this.redirect(returnUrl, originalForm);
            }
        },

        /** Initialize plugin */
        redirect: function (returnUrl, form) {
            var ppCheckoutInput;

            if (form) {
                ppCheckoutInput = form.find(this.options.ppCheckoutSelector)[0];

                if (!ppCheckoutInput) {
                    ppCheckoutInput = $(this.options.ppCheckoutInput);
                    ppCheckoutInput.appendTo(form);
                }

                $(ppCheckoutInput).val(returnUrl);

                form.submit();
            } else {
                window.location.assign(returnUrl);
            }
        }
    });

    $(document).on('breeze:mount:paypalCheckout', function (event, data) {
        $(data.el).paypalCheckout(data.settings);
    });
})();
