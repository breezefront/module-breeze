/* global breeze $t */
(function () {
    'use strict';

    breeze.widget('catalogAddToCart', {
        options: {
            processStart: null,
            processStop: null,
            bindSubmit: true,
            minicartSelector: '[data-block="minicart"]',
            messagesSelector: '[data-placeholder="messages"]',
            productStatusSelector: '.stock.available',
            addToCartButtonSelector: '.action.tocart',
            addToCartButtonDisabledClass: 'disabled',
            addToCartButtonTextWhileAdding: '',
            addToCartButtonTextAdded: '',
            addToCartButtonTextDefault: ''
        },

        /** Init widget */
        init: function () {
            var self = this,
                element = $(self.element);

            if (self.options.bindSubmit && !element.attr('data-catalog-addtocart-initialized')) {
                element.attr('data-catalog-addtocart-initialized', 1);
                element.on('submit', function (event) {
                    event.preventDefault();
                    self.submitForm($(element));
                });
            }

            $(self.options.addToCartButtonSelector, element).prop('disabled', false);
        },

        /**
         * @return {Boolean}
         */
        isLoaderEnabled: function () {
            return this.options.processStart && this.options.processStop;
        },

        /**
         * Handler for the form 'submit' event
         *
         * @param {Object} form
         */
        submitForm: function (form) {
            this.ajaxSubmit(form);
        },

        /**
         * @param {Object} form
         */
        ajaxSubmit: function (form) {
            var self = this;

            $(self.options.minicartSelector).trigger('contentLoading');

            self.disableAddToCartButton(form);

            if (self.isLoaderEnabled()) {
                $('body').trigger(self.options.processStart);
            }

            breeze.request.post({
                form: form,

                /** A method to run after error or success */
                complete: function () {
                    self.enableAddToCartButton(form);
                },

                /** Success callback */
                success: function (response) {
                    var data = response.body;

                    if (self.isLoaderEnabled()) {
                        $('body').trigger(self.options.processStop);
                    }

                    if (data.backUrl) {
                        if (data.backUrl === window.location.href) {
                            window.location.reload();
                        } else {
                            window.location.assign(data.backUrl);
                        }

                        return;
                    }

                    if (data.messages) {
                        $(self.options.messagesSelector).html(data.messages);
                    }

                    if (data.minicart) {
                        $(self.options.minicartSelector).replaceWith(data.minicart);
                        $(self.options.minicartSelector).trigger('contentUpdated');
                    }

                    if (data.product && data.product.statusText) {
                        $(self.options.productStatusSelector)
                            .removeClass('available')
                            .addClass('unavailable')
                            .find('span')
                            .html(data.product.statusText);
                    }
                }
            });
        },

        /**
         * @param {String} form
         */
        disableAddToCartButton: function (form) {
            var addToCartButtonTextWhileAdding = this.options.addToCartButtonTextWhileAdding || $t('Adding...'),
                addToCartButton = $(form).find(this.options.addToCartButtonSelector);

            addToCartButton.addClass(this.options.addToCartButtonDisabledClass);
            addToCartButton.find('span').text(addToCartButtonTextWhileAdding);
            addToCartButton.attr('title', addToCartButtonTextWhileAdding);
        },

        /**
         * @param {String} form
         */
        enableAddToCartButton: function (form) {
            var addToCartButtonTextAdded = this.options.addToCartButtonTextAdded || $t('Added'),
                self = this,
                addToCartButton = $(form).find(this.options.addToCartButtonSelector);

            addToCartButton.find('span').text(addToCartButtonTextAdded);
            addToCartButton.attr('title', addToCartButtonTextAdded);

            setTimeout(function () {
                var addToCartButtonTextDefault = self.options.addToCartButtonTextDefault || $t('Add to Cart');

                addToCartButton.removeClass(self.options.addToCartButtonDisabledClass);
                addToCartButton.find('span').text(addToCartButtonTextDefault);
                addToCartButton.attr('title', addToCartButtonTextDefault);
            }, 200);
        }
    });

    // $(document).on('submit', '[data-catalog-addtocart-initialized]', function (event) {
    //     event.preventDefault();
    //     $(this).catalogAddToCart('instance').ajaxSubmit($(this));
    // });

    $(document).on('breeze:mount:catalogAddToCart', function (event) {
        $(event.detail.el).catalogAddToCart(event.detail.settings);
    });
})();