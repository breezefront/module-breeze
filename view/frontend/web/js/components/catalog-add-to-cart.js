(function () {
    'use strict';

    $.widget('catalogAddToCart', {
        component: 'catalogAddToCart',
        options: {
            processStart: null,
            processStop: null,
            bindSubmit: true,
            minicartSelector: '[data-block="minicart"]',
            messagesSelector: '[data-placeholder="messages"]',
            productStatusSelector: '.stock.available',
            addToCartButtonSelector: '.action.tocart',
            addToCartButtonDisabledClass: 'disabled'
        },

        create: function () {
            var self = this,
                element = $(self.element);

            if (self.options.bindSubmit && !element.attr('data-catalog-addtocart-initialized')) {
                element.attr('data-catalog-addtocart-initialized', 1);
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

            $.request.post({
                form: form,
                dataType: 'json',
                complete: function () {
                    self.enableAddToCartButton(form);

                    if (self.isLoaderEnabled()) {
                        $('body').trigger(self.options.processStop);
                    }
                },
                success: function (data, status, response) {
                    data = self.getResponseData(response);

                    $(document).trigger('ajax:addToCart', {
                        'sku': form.data().productSku,
                        'productIds': [form.find('input[name=product]').val()],
                        'form': form,
                        'response': data
                    });

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
                    } else {
                        $(self.options.minicartSelector).trigger('contentSkipped');
                    }

                    if (data.product && data.product.statusText) {
                        $(self.options.productStatusSelector)
                            .removeClass('available')
                            .addClass('unavailable')
                            .find('span')
                            .html(data.product.statusText);
                    }
                },
                error: function (response) {
                    $(document).trigger('ajax:addToCart:error', {
                        'sku': form.data().productSku,
                        'productIds': [form.find('input[name=product]').val()],
                        'form': form,
                        'response': response
                    });
                }
            });
        },

        /**
         * @param {Object} response
         * @return {Object}
         */
        getResponseData: function (response) {
            return response.body;
        },

        /**
         * @param {String} form
         */
        disableAddToCartButton: function (form) {
            var addToCartButton = $(form).find(this.options.addToCartButtonSelector).not('.noloader');

            addToCartButton.addClass(this.options.addToCartButtonDisabledClass);
            addToCartButton.find('span').css('opacity', 0);
            addToCartButton.spinner(true, {
                css: {
                    width: 20,
                    height: 20,
                    background: 'none'
                }
            });
        },

        /**
         * @param {String} form
         */
        enableAddToCartButton: function (form) {
            var self = this,
                addToCartButton = $(form).find(this.options.addToCartButtonSelector).not('.noloader');

            setTimeout(function () {
                addToCartButton.removeClass(self.options.addToCartButtonDisabledClass);
                addToCartButton.find('span').css('opacity', '');
                addToCartButton.spinner(false);
            }, 200);
        }
    });

    $(document).on('submit', '[data-catalog-addtocart-initialized]', function (event) {
        event.preventDefault();
        $(this).catalogAddToCart('instance').ajaxSubmit($(this));
    });
})();
