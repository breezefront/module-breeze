/* global breeze ko _ $t */
(function () {
    'use strict';

    var minicart = $('[data-block="minicart"]');

    breeze.widget('sidebar', {
        options: {
            minicart: {
                maxItemsVisible: 3
            }
        },
        scrollHeight: 0,
        shoppingCartUrl: window.checkout.shoppingCartUrl,

        /** Create sidebar. */
        create: function () {
            this._addObservers();
            this._calcHeight();
        },

        /** Update sidebar block. */
        update: function () {
            this._calcHeight();
        },

        /** [_addObservers description] */
        _addObservers: function () {
            var self = this;

            this.element.on('click', this.options.button.checkout, function () {
                var cart = breeze.sections.get('cart'),
                    customer = breeze.sections.get('customer'),
                    element = $(self.options.button.checkout);

                if (!customer().firstname && cart().isGuestCheckoutAllowed === false) {
                    breeze.cookies.set('login_redirect', self.options.url.checkout);

                    // if (self.options.url.isRedirectRequired) {
                    element.prop('disabled', true);
                    location.href = self.options.url.loginUrl;
                    // } else {
                    //     authenticationPopup.showModal();
                    // }

                    return false;
                }

                element.prop('disabled', true);
                location.href = self.options.url.checkout;
            }).on('click', this.options.button.remove, function (event) {
                event.stopPropagation();

                if (confirm(self.options.confirmMessage)) {
                    self._removeItem($(event.currentTarget));
                    event.stopImmediatePropagation();
                }
            }).on('keyup change', this.options.item.qty, function (event) {
                self._showItemButton($(event.target));
            }).on('click', this.options.item.button, function (event) {
                event.stopPropagation();
                self._updateItemQty($(event.currentTarget));
            }).on('focusout', this.options.item.qty, function (event) {
                self._validateQty($(event.currentTarget));
            });
        },

        /**
         * @param {HTMLElement} elem
         */
        _showItemButton: function (elem) {
            var itemId = elem.data('cart-item'),
                itemQty = elem.data('item-qty');

            if (this._isValidQty(itemQty, elem.val())) {
                $('#update-cart-item-' + itemId).show('fade', 300);
            } else if (elem.val() == 0) { //eslint-disable-line eqeqeq
                this._hideItemButton(elem);
            } else {
                this._hideItemButton(elem);
            }
        },

        /**
         * @param {*} origin - origin qty. 'data-item-qty' attribute.
         * @param {*} changed - new qty.
         * @return {Boolean}
         */
        _isValidQty: function (origin, changed) {
            return origin != changed && //eslint-disable-line eqeqeq
                changed.length > 0 &&
                changed - 0 == changed && //eslint-disable-line eqeqeq
                changed - 0 > 0;
        },

        /**
         * @param {Object} elem
         */
        _validateQty: function (elem) {
            var itemQty = elem.data('item-qty');

            if (!this._isValidQty(itemQty, elem.val())) {
                elem.val(itemQty);
            }
        },

        /**
         * @param {HTMLElement} elem
         */
        _hideItemButton: function (elem) {
            $('#update-cart-item-' + elem.data('cart-item')).hide();
        },

        /**
         * @param {HTMLElement} elem
         */
        _updateItemQty: function (elem) {
            var itemId = elem.data('cart-item');

            this._ajax(this.options.url.update, {
                'item_id': itemId,
                'item_qty': $('#cart-item-' + itemId + '-qty').val()
            }, elem, this._updateItemQtyAfter);
        },

        /**
         * Update content after update qty
         *
         * @param {HTMLElement} elem
         */
        _updateItemQtyAfter: function (elem) {
            var productData = this._getProductById(Number(elem.data('cart-item')));

            if (!_.isUndefined(productData)) {
                $(document).trigger('ajax:updateCartItemQty');

                if (window.location.href === this.shoppingCartUrl) {
                    window.location.reload(false);
                }
            }

            this._hideItemButton(elem);
        },

        /**
         * @param {HTMLElement} elem
         */
        _removeItem: function (elem) {
            this._ajax(this.options.url.remove, {
                'item_id': elem.data('cart-item')
            }, elem, this._removeItemAfter);
        },

        /**
         * Update content after item remove
         *
         * @param {Object} elem
         */
        _removeItemAfter: function (elem) {
            var productData = this._getProductById(Number(elem.data('cart-item')));

            if (!_.isUndefined(productData)) {
                $(document).trigger('ajax:removeFromCart', {
                    productIds: [productData.product_id],
                    productInfo: [{
                        'id': productData.product_id
                    }]
                });

                if (window.location.href.indexOf(this.shoppingCartUrl) === 0) {
                    window.location.reload();
                }
            }
        },

        /**
         * Retrieves product data by Id.
         *
         * @param {Number} productId - product Id
         * @return {Object|undefined}
         */
        _getProductById: function (productId) {
            return _.find(breeze.sections.get('cart')().items, function (item) {
                return productId === Number(item.item_id);
            });
        },

        /**
         * @param {String} url - ajax url
         * @param {Object} data - post data for ajax call
         * @param {Object} elem - element that initiated the event
         * @param {Function} callback - callback method to execute after AJAX success
         */
        _ajax: function (url, data, elem, callback) {
            elem.prop('disabled', true);

            breeze.request.post({
                url: url,
                data: data,
                type: 'form'
            }).then(function (response) {
                elem.prop('disabled', false);

                if (response.success) {
                    callback.call(this, elem, response);
                } else if (response.error_message) {
                    alert(response.error_message);
                }
            });
        },

        /**
         * Calculate height of minicart list
         *
         */
        _calcHeight: function () {
            var self = this,
                height = 0,
                counter = this.options.minicart.maxItemsVisible,
                target = $(this.options.minicart.list),
                outerHeight;

            self.scrollHeight = 0;
            target.children().each(function () {
                if ($(this).find('.options').length > 0) {
                    $(this).collapsible();
                }
                outerHeight = $(this).outerHeight(true);

                if (counter-- > 0) {
                    height += outerHeight;
                }
                self.scrollHeight += outerHeight;
            });

            target.parent().height(height);
        }
    });

    breeze.view('minicart', {
        cart: {},
        shoppingCartUrl: window.checkout.shoppingCartUrl,
        maxItemsToDisplay: window.checkout.maxItemsToDisplay,
        shouldRender: ko.observable(false),
        isLoading: ko.observable(false),
        displaySubtotal: ko.observable(true),
        addToCartCalls: 0,

        /** [create description] */
        create: function () {
            var self = this,
                cartData = breeze.sections.get('cart');

            this.update(cartData());

            cartData.subscribe(function (updatedCart) {
                self.addToCartCalls--;
                self.isLoading(self.addToCartCalls > 0);
                self.update(updatedCart);
                self.initSidebar();
            });

            minicart
                .one('dropdowndialogopen', function () {
                    self.shouldRender(true);
                })
                .on('dropdowndialogopen', function () {
                    self.initSidebar();
                })
                .on('contentLoading', function () {
                    self.addToCartCalls++;
                    self.isLoading(true);
                });

            if (cartData().website_id !== window.checkout.websiteId && cartData().website_id !== undefined ||
                cartData().storeId !== window.checkout.storeId && cartData().storeId !== undefined
            ) {
                breeze.sections.reload(['cart'], false);
            }
        },

        /** init sidebar widget */
        initSidebar: function () {
            var sidebar = minicart.sidebar('instance');

            minicart.trigger('contentUpdated');

            if (sidebar) {
                return sidebar.update();
            }

            if (!$('[data-role=product-item]').length) {
                return false;
            }

            minicart.sidebar({
                targetElement: 'div.block.block-minicart',
                url: {
                    checkout: window.checkout.checkoutUrl,
                    update: window.checkout.updateItemQtyUrl,
                    remove: window.checkout.removeItemUrl,
                    loginUrl: window.checkout.customerLoginUrl,
                    isRedirectRequired: window.checkout.isRedirectRequired
                },
                button: {
                    checkout: '#top-cart-btn-checkout',
                    remove: '#mini-cart a.action.delete',
                    close: '#btn-minicart-close'
                },
                showcart: {
                    parent: 'span.counter',
                    qty: 'span.counter-number',
                    label: 'span.counter-label'
                },
                minicart: {
                    list: '#mini-cart',
                    content: '#minicart-content-wrapper',
                    qty: 'div.items-total',
                    subtotal: 'div.subtotal span.price',
                    maxItemsVisible: window.checkout.minicartMaxItemsVisible
                },
                item: {
                    qty: '.cart-item-qty',
                    button: '.update-cart-item'
                },
                confirmMessage: $t('Are you sure you would like to remove this item from the shopping cart?')
            });
        },

        /** Close mini shopping cart. */
        closeMinicart: function () {
            minicart.find('[data-role="dropdownDialog"]').dropdownDialog('close');
        },

        /**
         * @param {Object} item
         * @return {*|String}
         */
        getItemRenderer: function (item) {
            var renderer = this.options.itemRenderer[item.product_type];

            if (renderer && document.getElementById(renderer)) {
                return renderer;
            }

            return 'defaultRenderer';
        },

        /**
         * @param {Object} updatedCart
         */
        update: function (updatedCart) {
            _.each(updatedCart, function (value, key) {
                if (!this.cart.hasOwnProperty(key)) {
                    this.cart[key] = ko.observable();
                }
                this.cart[key](value);
            }, this);
        },

        /**
         * @param {String} name
         * @return {*}
         */
        getCartParamUnsanitizedHtml: function (name) {
            if (!_.isUndefined(name)) {
                if (!this.cart.hasOwnProperty(name)) {
                    this.cart[name] = ko.observable();
                }
            }

            return this.cart[name]();
        },

        /**
         * @param {String} name
         * @return {*}
         */
        getCartParam: function (name) {
            return this.getCartParamUnsanitizedHtml(name);
        },

        /**
         * Returns array of cart items, limited by 'maxItemsToDisplay' setting
         * @return []
         */
        getCartItems: function () {
            var items = this.getCartParamUnsanitizedHtml('items') || [];

            items = items.slice(parseInt(-this.maxItemsToDisplay, 10));

            return items;
        },

        /**
         * @return {Number}
         */
        getCartLineItemsCount: function () {
            var items = this.getCartParamUnsanitizedHtml('items') || [];

            return parseInt(items.length, 10);
        }
    });

    ko.components.register('subtotal.totals', {
        /** Constructor */
        viewModel: function (options) {
            this.cart = breeze.sections.get('cart');
            this.displaySubtotal = options.$root.displaySubtotal;
            $.extend(
                this,
                options.$root.path('children/subtotal.container/children/subtotal/children/subtotal.totals/config')
            );
        },
        template: {
            element: 'subtotal.totals'
        }
    });

    document.addEventListener('breeze:mount:Magento_Checkout/js/view/minicart', function (event) {
        $(event.detail.el).minicart(event.detail.settings);
    });
})();
