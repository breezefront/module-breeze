/* global breeze _ */
(function () {
    'use strict';

    breeze.widget('addToCart', {
        options: {
            origin: 'msrp',
            popUpAttr: '[data-role=msrp-popup-template]',
            popupCartButtonId: '#map-popup-button',
            paypalCheckoutButons: '[data-action=checkout-form-submit]',
            msrpLabelId: '#map-popup-msrp',
            priceLabelId: '#map-popup-price',
            popUpOptions: {
                appendTo: 'body',
                dialogContentClass: 'active',
                closeOnMouseLeave: false,
                autoPosition: true,
                dialogClass: 'popup map-popup-wrapper',
                shadowHinter: 'popup popup-pointer',
                position: {}
            }
        },

        /** Init widget */
        create: function () {
            if (this.options.origin === 'msrp') {
                this.initMsrpPopup();
            } else if (this.options.origin === 'info') {
                this.initInfoPopup();
            } else if (this.options.origin === 'tier') {
                this.initTierPopup();
            }
        },

        /** Remove event listeners and dom elements */
        destroy: function () {
            this.$popup.remove();
        },

        /** Init msrp popup */
        initMsrpPopup: function () {
            var self = this,
                popupDOM = $(self.options.popUpAttr)[0],
                target = $(self.options.popupId);

            if (self.options.popupId.indexOf(this.element.attr('id')) > -1) {
                target = this.element; // fix for multiple elements with the same id on the page
            }

            self.$popup = $(popupDOM.innerHTML.trim());
            self.$popup.find(self.options.productIdInput).val(self.options.productId);
            $('body').append(self.$popup);
            self.$popup.trigger('contentUpdated');

            self.$popup.find('button')
                .on('click.msrp', self.handleMsrpAddToCart.bind(self))
                .filter(self.options.popupCartButtonId)
                .text(self.getAddToCartButton().text());

            self.$popup.find(self.options.paypalCheckoutButons)
                .on('click.msrp', self.handleMsrpPaypalCheckout.bind(self));

            target.on('click.msrp', self.updatePopupContent.bind(self));

            self.$popup.dropdownDialog($.extend(self.options.popUpOptions, {
                triggerTarget: target,
                position: {
                    of: target
                }
            }));
        },

        /** Init tier price popup */
        initTierPopup: function () {
            var self = this,
                popupDOM = $(self.options.popUpAttr)[0];

            self.$popup = $(popupDOM.innerHTML.trim());
            self.$popup.find(self.options.productIdInput).val(self.options.productId);
            $('body').append(self.$popup);
            self.$popup.trigger('contentUpdated');

            self.$popup.find('button')
                .on('click.msrp', self.handleTierAddToCart.bind(self))
                .filter(self.options.popupCartButtonId)
                .text(self.getAddToCartButton().text());

            self.$popup.find(self.options.paypalCheckoutButons)
                .on('click.msrp', self.handleTierPaypalCheckout.bind(self));

            self.$popup.dropdownDialog(self.options.popUpOptions);

            $(self.options.attr).on('click.msrp', function (event) {
                var dialog = self.$popup.dropdownDialog('instance');

                event.preventDefault();

                if (dialog.trigger && dialog.trigger.has(event.target).length) {
                    return;
                }

                self.$popup.dropdownDialog({
                    triggerTarget: $(event.target),
                    position: {
                        of: $(event.target)
                    }
                });
                self.$popup.dropdownDialog('open');

                self.tierOptions = $(event.target).data('tier-price');
                self.updatePopupContent();
            });
        },

        /** Init info popup */
        initInfoPopup: function () {
            var infoPopupDOM = $('[data-role=msrp-info-template]')[0];

            this.$popup = $(infoPopupDOM.innerHTML.trim());

            $('body').append(this.$popup);

            this.$popup.dropdownDialog($.extend(this.options.popUpOptions, {
                triggerTarget: $(this.options.helpLinkId),
                position: {
                    of: $(this.options.helpLinkId)
                }
            }));
        },

        /** Fixed not working seletor with :has token */
        getAddToCartButton: function () {
            var productId = this.options.productId,
                button,
                context;

            if (this.options.addToCartButton && this.options.addToCartButton.indexOf(':has') !== -1) {
                context = $('form[action*="/"]')
                    .has('input[type="hidden"][name="product"][value="%1"]'.replace('%1', productId))
                    .add('.block.widget .price-box[data-product-id="%1"]+.product-item-actions'.replace('%1', productId));

                button = $('button[type="submit"], button.tocart', context);
            } else {
                button = $(this.options.addToCartButton);
            }

            return button;
        },

        /** Update popup content */
        updatePopupContent: function () {
            var options = this.tierOptions || this.options;

            this.$popup.find(this.options.msrpLabelId).html(options.msrpPrice);
            this.$popup.find(this.options.priceLabelId).html(options.realPrice);

            if (!this.options.isSaleable) {
                this.$popup.find('form').hide();
            }
        },

        /** Close MAP information popup */
        closePopup: function () {
            this.$popup.dropdownDialog('close');
        },

        /**
         * handle 'AddToCart' click on Msrp popup
         * @param {Object} ev
         *
         * @private
         */
        handleMsrpAddToCart: function (ev) {
            ev.preventDefault();

            if (this.options.addToCartButton) {
                this.getAddToCartButton().click();
                this.closePopup();
            }
        },

        /**
         * @private
         */
        handleMsrpPaypalCheckout: function () {
            this.closePopup();
        },

        /**
         * handle 'AddToCart' click on Tier popup
         *
         * @param {Object} ev
         * @private
         */
        handleTierAddToCart: function (ev) {
            ev.preventDefault();

            if (this.options.addToCartButton &&
                this.options.inputQty && !isNaN(this.tierOptions.qty)
            ) {
                $(this.options.inputQty).val(this.tierOptions.qty);
                $(this.options.addToCartButton).click();
                this.closePopup();
            }
        },

        /**
         * handle 'paypal checkout buttons' click on Tier popup
         *
         * @private
         */
        handleTierPaypalCheckout: function () {
            if (this.options.inputQty && !isNaN(this.tierOptions.qty)) {
                $(this.options.inputQty).val(this.tierOptions.qty);
                this.closePopup();
            }
        }
    });

    // minicart totals integration
    $(document).one('breeze:mount:Magento_Checkout/js/view/minicart', function () {
        /**
         * @param {Array} cartItems
         * @return {Boolean}
         */
        function isMsrpApplied(cartItems) {
            return _.find(cartItems, function (item) {
                if (_.has(item, 'canApplyMsrp')) {
                    return item.canApplyMsrp;
                }

                return false;
            });
        }

        breeze.sections.get('cart').subscribe(function (updatedCart) {
            var view = window.breeze.registry.get('minicart')[0];

            if (view) {
                view.displaySubtotal(!isMsrpApplied(updatedCart.items));
            }
        }, this);
    });

    $(document).on('breeze:mount:addToCart', function (event, data) {
        $(data.el).addToCart(data.settings);
    });
})();
