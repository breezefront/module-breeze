(function () {
    'use strict';

    $.widget('paypalCheckout', {
        component: 'paypalCheckout',
        options: {
            productId: 'input[type="hidden"][name="product"]',
            ppCheckoutSelector: '[data-role=pp-checkout-url]',
            ppCheckoutInput: '<input type="hidden" data-role="pp-checkout-url" name="return_url" value="">'
        },

        create: function () {
            this.agreements = $.sections.get('paypal-billing-agreement');
            this.onClickHandler = this.onClick.bind(this);
            this.element.on('click', '[data-action="checkout-form-submit"]', this.onClickHandler);
        },

        destroy: function () {
            this.element.off('click', this.onClickHandler);
            this._super();
        },

        onClick: function (event) {
            var self = this,
                target = $(event.target),
                returnUrl = target.data('checkout-url'),
                form = target.closest('form'),
                productId = form.find(this.options.productId).val(),
                originalForm = productId ? form : false;

            event.preventDefault();

            if (productId && !form.attr('action').length) {
                originalForm = $('form[action*="/"]')
                    .has('input[name="product"][value="%1"]'.replace('%1', productId));
            }

            if (this.agreements().askToCreate) {
                require(['Magento_Ui/js/modal/confirm'], confirm => {
                    confirm({
                        content: this.agreements().confirmMessage,
                        actions: {
                            confirm: function () {
                                self.redirect(self.agreements().confirmUrl, originalForm);
                            },
                            cancel: function () {
                                self.redirect(returnUrl, originalForm);
                            }
                        }
                    });
                });
            } else {
                this.redirect(returnUrl, originalForm);
            }
        },

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
})();
