(function () {
    'use strict';

    $.widget('addToCart', {
        component: 'addToCart',
        options: {
            origin: '',
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

        create: function () {
            if (this.options.origin === 'msrp') {
                this.initMsrpPopup();
            } else if (this.options.origin === 'info') {
                this.initInfoPopup();
            } else if (this.options.origin === 'tier') {
                this.initTierPopup();
            }
        },

        destroy: function () {
            if (this.$popup) {
                this.$popup.remove();
            }
            this._super();
        },

        initMsrpPopup: function () {
            var self = this,
                popupDOM = $(self.options.popUpAttr)[0],
                target = $(self.options.popupId);

            if (!popupDOM) {
                return;
            }

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
                button;

            if (this.options.addToCartButton && this.options.addToCartButton.indexOf(':has') !== -1) {
                button = $('form[action*="/"]')
                    .has('input[type="hidden"][name="product"][value="%1"]'.replace('%1', productId))
                    // eslint-disable-next-line max-len
                    .add('.block.widget .price-box[data-product-id="%1"]+.product-item-actions'.replace('%1', productId))
                    .find('button[type="submit"], button.tocart');
            } else {
                button = $(this.options.addToCartButton);
            }

            return button.first();
        },

        updatePopupContent: function () {
            var options = this.tierOptions || this.options;

            this.$popup.find(this.options.msrpLabelId).html(options.msrpPrice);
            this.$popup.find(this.options.priceLabelId).html(options.realPrice);

            if (!this.options.isSaleable) {
                this.$popup.find('form').hide();
            }
        },

        closePopup: function () {
            this.$popup.dropdownDialog('close');
        },

        /**
         * handle 'AddToCart' click on Msrp popup
         * @param {Object} ev
         */
        handleMsrpAddToCart: function (ev) {
            ev.preventDefault();

            if (this.options.addToCartButton && this.getAddToCartButton().length) {
                this.getAddToCartButton().click();
                this.getAddToCartButton().get(0).click();
                this.closePopup();
            }
        },

        handleMsrpPaypalCheckout: function () {
            this.closePopup();
        },

        /**
         * handle 'AddToCart' click on Tier popup
         *
         * @param {Object} ev
         */
        handleTierAddToCart: function (ev) {
            ev.preventDefault();

            if (this.options.addToCartButton && this.getAddToCartButton().length &&
                this.options.inputQty && !isNaN(this.tierOptions.qty)
            ) {
                $(this.options.inputQty).val(this.tierOptions.qty);
                this.getAddToCartButton().click();
                this.getAddToCartButton().get(0).click();
                this.closePopup();
            }
        },

        handleTierPaypalCheckout: function () {
            if (this.options.inputQty && !isNaN(this.tierOptions.qty)) {
                $(this.options.inputQty).val(this.tierOptions.qty);
                this.closePopup();
            }
        }
    });

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

        $.sections.get('cart').subscribe(function (updatedCart) {
            var view = $.registry.get('minicart')[0];

            if (view) {
                view.displaySubtotal(!isMsrpApplied(updatedCart.items));
            }
        }, this);
    });
})();
