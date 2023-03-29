(function () {
    'use strict';

    /*globals Minicart */

    /**
     * Getter for cookie
     *
     * @param {String} name
     */
    function getCookie(name) {
        var cookie = ' ' + document.cookie,
            search = ' ' + name + '=',
            setStr = null,
            offset = 0,
            end = 0;

        /* eslint-disable eqeqeq */
        /* eslint-disable max-depth */

        if (cookie.length > 0) {
            offset = cookie.indexOf(search);

            if (offset != -1) {
                offset += search.length;
                end = cookie.indexOf(';', offset);

                if (end == -1) {
                    end = cookie.length;
                }
                setStr = decodeURI(cookie.substring(offset, end));
            }
        }

        /* eslint-enable eqeqeq */
        /* eslint-enable max-depth */

        return setStr;
    }

    /**
     * Delete cookie
     *
     * @param {String} name
     */
    function delCookie(name) {
        var date = new Date(0);

        document.cookie = name + '=' + '; path=/; expires=' + date.toUTCString();
    }

    /**
     * Google analytics universal cart class
     *
     * @param {Object} config
     */
    function GoogleAnalyticsUniversalCart(config) {
        this.dlCurrencyCode = config.dlCurrencyCode;
        this.dataLayer = config.dataLayer;
        this.cookieAddToCart = config.cookieAddToCart;
        this.cookieRemoveFromCart = config.cookieRemoveFromCart;
        this.productQtys = [];
        this.origProducts = {};
        this.productWithChanges = [];
        this.addedProducts = [];
        this.removedProducts = [];
        this.googleAnalyticsUniversalData = {};
    }

    GoogleAnalyticsUniversalCart.prototype = {
        // ------------------- shopping cart ------------------------

        /**
         * Listen mini cart reload
         */
        listenMinicartReload: function () {
            var context = this;

            if (!_.isUndefined(window.Minicart) && typeof Minicart.prototype.initAfterEvents) {
                Minicart.prototype.initAfterEvents['GoogleAnalyticsUniversalCart:subscribeProductsUpdateInCart'] =

                    /**
                     * Wrapper function
                     */
                    function () {
                        context.subscribeProductsUpdateInCart();
                        context.parseAddToCartCookies();
                        context.parseRemoveFromCartCookies();
                    };
                // if we are removing last item init don't calling
                Minicart.prototype.removeItemAfterEvents[
                    'GoogleAnalyticsUniversalCart:subscribeProductsRemoveFromCart'
                    ] =

                    /**
                     * Wrapper function
                     */
                    function () {
                        context.parseRemoveFromCartCookies();
                    };
            }
        },

        /**
         * Subscribe products update in cart
         */
        subscribeProductsUpdateInCart: function () {
            var context = this;

            $(document)
                .on('mousedown', '[data-cart-item-update]', function () {
                    context.collectCustomerProducts();
                })
                .on('mousedown', '.update-cart-item', function () {
                    context.collectCustomerProducts();
                })
                .on('mousedown', '[data-multiship-item-update]', function () {
                    context.collectOriginalProducts();
                    context.collectMultiCartQtys();
                })
                .on('mousedown', '[data-multiship-item-remove]', function () {
                    context.collectOriginalProducts();
                    context.collectMultiCartQtys();
                    context.updateMulticartCartObserver();
                })
                .on('mousedown', '[data-cart-empty]', function () {
                    context.emptyCartObserver();
                })
                .on('ajax:updateCartItemQty', function () {
                    context.updateCartObserver();
                })
                .on('ajax:updateMulticartItemQty', function () {
                    context.updateMulticartCartObserver();
                });
        },

        /**
         * Empty cart observer
         */
        emptyCartObserver: function () {
            var product,
                i;

            this.collectOriginalProducts();

            /* eslint-disable eqeqeq */
            for (i in this.origProducts) {
                if (i != 'length' && this.origProducts.hasOwnProperty(i)) {
                    product = $.extend({}, this.origProducts[i]);
                    this.removedProducts.push(product);
                }
            }

            /* eslint-enable eqeqeq */

            this.cartItemRemoved();
        },

        /**
         * Update multi cart observer
         */
        updateMulticartCartObserver: function () {
            this.collectMultiProductsWithChanges();
            this.collectProductsForMessages();
            this.cartItemAdded();
            this.cartItemRemoved();
        },

        /**
         * Update cart observer
         */
        updateCartObserver: function () {
            this.collectProductsWithChanges();
            this.collectProductsForMessages();
            this.cartItemAdded();
            this.cartItemRemoved();
        },

        /**
         * Collect multi products with changes
         */
        collectMultiProductsWithChanges: function () {
            var groupedProducts = {},
                cartProduct,
                i = 0,
                j,
                product;

            this.productWithChanges = [];

            for (i; i < this.productQtys.length; i++) {
                cartProduct = this.productQtys[i];

                if (_.isUndefined(groupedProducts[cartProduct.id])) {
                    groupedProducts[cartProduct.id] = parseInt(cartProduct.qty, 10);
                } else {
                    groupedProducts[cartProduct.id] += parseInt(cartProduct.qty, 10);
                }
            }

            /* eslint-disable max-depth */
            /* eslint-disable eqeqeq */
            for (j in groupedProducts) {

                if (groupedProducts.hasOwnProperty(j)) {

                    if (!_.isUndefined(this.origProducts[j]) && groupedProducts[j] != this.origProducts[j].qty) {
                        product = $.extend({}, this.origProducts[j]);
                        product.qty = groupedProducts[j];
                        this.productWithChanges.push(product);
                    }
                }
            }

            /* eslint-enable max-depth */
            /* eslint-enable eqeqeq */
        },

        /**
         * Collect products with changes
         */
        collectProductsWithChanges: function () {
            var i = 0,
                cartProduct,
                product;

            this.productWithChanges = [];

            /* eslint-disable eqeqeq */
            /* eslint-disable max-depth */
            for (i; i < this.productQtys.length; i++) {
                cartProduct = this.productQtys[i];

                if (
                    !_.isUndefined(this.origProducts[cartProduct.id]) &&
                    cartProduct.qty != this.origProducts[cartProduct.id].qty
                ) {
                    product = $.extend({}, this.origProducts[cartProduct.id]);

                    if (parseInt(cartProduct.qty, 10) > 0) {
                        product.qty = cartProduct.qty;
                        this.productWithChanges.push(product);
                    }
                }
            }

            /* eslint-enable max-depth */
            /* eslint-enable eqeqeq */
        },

        /**
         * Retrieves data about added products.
         */
        collectCustomerProducts: function () {
            this.collectOriginalProducts();
            this.collectCartQtys();
            this.collectMiniCartQtys();
        },

        /**
         * Collect original products
         */
        collectOriginalProducts: function () {
            var products = {},
                items = $.customerData.get('cart')().items;

            if (!_.isUndefined(items)) {
                items.forEach(function (item) {
                    products[item.product_sku] = {
                        id: item.product_sku,
                        name: item.product_name,
                        price: item.product_price_value,
                        qty: parseInt(item.qty, 10)
                    };
                });
            }

            this.googleAnalyticsUniversalData.shoppingCartContent = products;
            this.origProducts = this.googleAnalyticsUniversalData.shoppingCartContent;
        },

        /**
         * Collect multi cart qtys
         */
        collectMultiCartQtys: function () {
            var productQtys = [];

            $('[data-multiship-item-id]').each(function (index, elem) {
                productQtys.push({
                    id: $(elem).data('multiship-item-id'),
                    qty: $(elem).val()
                });
            });

            this.productQtys = productQtys;
        },

        /**
         * Collect cart qtys
         */
        collectCartQtys: function () {
            var productQtys = [];

            $('[data-cart-item-id]').each(function (index, elem) {
                productQtys.push({
                    id: $(elem).data('cart-item-id'),
                    qty: $(elem).val()
                });
            });

            this.productQtys = productQtys;
        },

        /**
         * Collect mini cart qtys
         */
        collectMiniCartQtys: function () {
            var productQtys = [];

            $('input[data-cart-item-id]').each(function (index, elem) {
                productQtys.push({
                    id: $(elem).data('cart-item-id'),
                    qty: $(elem).val()
                });
            });

            this.productQtys = productQtys;
        },

        /**
         * Collect products for messages
         */
        collectProductsForMessages: function () {
            var i = 0,
                product;

            this.addedProducts = [];
            this.removedProducts = [];

            /* eslint-disable max-depth */
            for (i; i < this.productWithChanges.length; i++) {
                product = this.productWithChanges[i];

                if (!_.isUndefined(this.origProducts[product.id])) {

                    if (product.qty > this.origProducts[product.id].qty) {
                        product.qty = Math.abs(product.qty - this.origProducts[product.id].qty);
                        this.addedProducts.push(product);
                    } else if (product.qty < this.origProducts[product.id].qty) {
                        product.qty = Math.abs(this.origProducts[product.id].qty - product.qty);
                        this.removedProducts.push(product);
                    }
                }
            }

            /* eslint-enable max-depth */
        },

        /**
         * Format products array
         *
         * @param {Object} productsIn
         */
        formatProductsArray: function (productsIn) {
            var productsOut = [],
                itemId,
                i;

            /* eslint-disable max-depth */
            /* eslint-disable eqeqeq */
            for (i in productsIn) {

                if (i != 'length' && productsIn.hasOwnProperty(i)) {

                    if (!_.isUndefined(productsIn[i].sku)) {
                        itemId = productsIn[i].sku;
                    } else {
                        itemId = productsIn[i].id;
                    }

                    productsOut.push({
                        id: itemId,
                        name: productsIn[i].name,
                        price: productsIn[i].price,
                        quantity: parseInt(productsIn[i].qty, 10)
                    });
                }
            }

            /* eslint-enable max-depth */
            /* eslint-enable eqeqeq */

            return productsOut;
        },

        /**
         * Cart item add action
         */
        cartItemAdded: function () {
            if (!this.addedProducts.length) {
                return;
            }

            this.dataLayer.push({
                event: 'addToCart',
                ecommerce: {
                    currencyCode: this.dlCurrencyCode,
                    add: {
                        products: this.formatProductsArray(this.addedProducts)
                    }
                }
            });

            this.addedProducts = [];
        },

        /**
         * Cart item remove action
         */
        cartItemRemoved: function () {
            if (!this.removedProducts.length) {
                return;
            }

            this.dataLayer.push({
                event: 'removeFromCart',
                ecommerce: {
                    currencyCode: this.dlCurrencyCode,
                    remove: {
                        products: this.formatProductsArray(this.removedProducts)
                    }
                }
            });

            this.removedProducts = [];
        },

        /**
         * Parse add from cart cookies.
         */
        parseAddToCartCookies: function () {
            var addProductsList;

            if (getCookie(this.cookieAddToCart)) {
                this.addedProducts = [];
                addProductsList = decodeURIComponent(getCookie(this.cookieAddToCart));
                this.addedProducts = JSON.parse(addProductsList);
                delCookie(this.cookieAddToCart);
                this.cartItemAdded();
            }
        },

        /**
         * Parse remove from cart cookies.
         */
        parseRemoveFromCartCookies: function () {
            var removeProductsList;

            if (getCookie(this.cookieRemoveFromCart)) {
                this.removedProducts = [];
                removeProductsList = decodeURIComponent(getCookie(this.cookieRemoveFromCart));
                this.removedProducts = JSON.parse(removeProductsList);
                delCookie(this.cookieRemoveFromCart);
                this.cartItemRemoved();
            }
        }
    };

    window.GoogleAnalyticsUniversalCart = GoogleAnalyticsUniversalCart;

    /**
     * Google analytics universal class
     *
     * @param {Object} config
     */
    function GoogleAnalyticsUniversal(config) {
        this.blockNames = config.blockNames;
        this.dlCurrencyCode = config.dlCurrencyCode;
        this.dataLayer = config.dataLayer;
        this.staticImpressions = config.staticImpressions;
        this.staticPromotions = config.staticPromotions;
        this.updatedImpressions = config.updatedImpressions;
        this.updatedPromotions = config.updatedPromotions;
    }

    GoogleAnalyticsUniversal.prototype = {

        /**
         * Active on category action
         *
         * @param {String} id
         * @param {String} name
         * @param {String} category
         * @param {Object} list
         * @param {String} position
         */
        activeOnCategory: function (id, name, category, list, position) {
            this.dataLayer.push({
                event: 'productClick',
                ecommerce: {
                    click: {
                        actionField: {
                            list: list
                        },
                        products: [{
                            id: id,
                            name: name,
                            category: category,
                            list: list,
                            position: position
                        }]
                    }
                }
            });
        },

        /**
         * Active on products action
         *
         * @param {String} id
         * @param {String} name
         * @param {Object} list
         * @param {String} position
         * @param {String} category
         */
        activeOnProducts: function (id, name, list, position, category) {
            this.dataLayer.push({
                event: 'productClick',
                ecommerce: {
                    click: {
                        actionField: {
                            list: list
                        },
                        products: [{
                            id: id,
                            name: name,
                            list: list,
                            position: position,
                            category: category
                        }]
                    }
                }
            });
        },

        /**
         * Add to cart action
         *
         * @param {String} id
         * @param {String} name
         * @param {String} price
         * @param {String} quantity
         */
        addToCart: function (id, name, price, quantity) {
            this.dataLayer.push({
                event: 'addToCart',
                ecommerce: {
                    currencyCode: this.dlCurrencyCode,
                    add: {
                        products: [{
                            id: id,
                            name: name,
                            price: price,
                            quantity: quantity
                        }]
                    }
                }
            });
        },

        /**
         * Remove from cart action
         *
         * @param {String} id
         * @param {String} name
         * @param {String} price
         * @param {String} quantity
         */
        removeFromCart: function (id, name, price, quantity) {
            this.dataLayer.push({
                event: 'removeFromCart',
                ecommerce: {
                    currencyCode: this.dlCurrencyCode,
                    remove: {
                        products: [{
                            id: id,
                            name: name,
                            price: price,
                            quantity: quantity
                        }]
                    }
                }
            });
        },

        /**
         * Click banner action
         *
         * @param {String} id
         * @param {String} name
         * @param {String} creative
         * @param {String} position
         */
        clickBanner: function (id, name, creative, position) {
            this.dataLayer.push({
                event: 'promotionClick',
                ecommerce: {
                    promoClick: {
                        promotions: [{
                            id: id,
                            name: name,
                            creative: creative,
                            position: position
                        }]
                    }
                }
            });
        },

        /**
         * Bind impression click
         *
         * @param {String} id
         * @param {String} type
         * @param {String} name
         * @param {String} category
         * @param {Object} list
         * @param {String} position
         * @param {String} blockType
         * @param {String} listPosition
         */
        bindImpressionClick: function (id, type, name, category, list, position, blockType, listPosition) {
            var productLink = [],
                eventBlock;

            switch (blockType)  {
                case 'catalog.product.related':
                    eventBlock = '.products-related .products';
                    break;

                case 'product.info.upsell':
                    eventBlock = '.products-upsell .products';
                    break;

                case 'checkout.cart.crosssell':
                    eventBlock = '.products-crosssell .products';
                    break;

                case 'category.products.list':
                case 'search_result_list':
                    eventBlock = '.products .products';
                    break;

            }

            productLink = $(eventBlock + ' .item:nth-child(' + listPosition + ') a');

            if (type === 'configurable' || type === 'bundle' || type === 'grouped') {
                productLink = $(
                    eventBlock + ' .item:nth-child(' + listPosition + ') .tocart',
                    eventBlock + ' .item:nth-child(' + listPosition + ') a'
                );
            }

            productLink.each(function (index, element) {
                $(element).on('click', function () {
                    // Product category cannot be detected properly if customer is not on category page
                    if (blockType !== 'category.products.list') {
                        category = '';
                    }

                    this.activeOnProducts(
                        id,
                        name,
                        list,
                        position,
                        category);
                }.bind(this));
            }.bind(this));
        },

        /**
         * Update impressions
         */
        updateImpressions: function () {
            var pageImpressions = this.mergeImpressions(),
                dlImpressions = {
                    event: 'productImpression',
                    ecommerce: {
                        impressions: []
                    }
                },
                i = 0,
                impressionCounter = 0,
                impression,
                blockName;

            for (blockName in pageImpressions) {
                // jscs:disable disallowKeywords
                if (blockName === 'length' || !pageImpressions.hasOwnProperty(blockName)) {
                    continue;
                }

                // jscs:enable disallowKeywords

                for (i; i < pageImpressions[blockName].length; i++) {
                    impression = pageImpressions[blockName][i];
                    dlImpressions.ecommerce.impressions.push({
                        id: impression.id,
                        name: impression.name,
                        category: impression.category,
                        list: impression.list,
                        position: impression.position
                    });
                    impressionCounter++;
                    this.bindImpressionClick(
                        impression.id,
                        impression.type,
                        impression.name,
                        impression.category,
                        impression.list,
                        impression.position,
                        blockName,
                        impression.listPosition
                    );
                }
            }

            if (impressionCounter > 0) {
                this.dataLayer.push(dlImpressions);
            }
        },

        /**
         * Merge impressions
         */
        mergeImpressions: function () {
            var pageImpressions = [];

            this.blockNames.forEach(function (blockName) {
                // check if there is a new block generated by FPC placeholder update
                if (blockName in this.updatedImpressions) {
                    pageImpressions[blockName] = this.updatedImpressions[blockName];
                } else if (blockName in this.staticImpressions) { // use the static data otherwise
                    pageImpressions[blockName] = this.staticImpressions[blockName];
                }
            }, this);

            return pageImpressions;
        },

        /**
         * Update promotions
         */
        updatePromotions: function () {
            var dlPromotions = {
                    event: 'promotionView',
                    ecommerce: {
                        promoView: {
                            promotions: []
                        }
                    }
                },
                pagePromotions = [],
                promotionCounter = 0,
                bannerIds = [],
                i = 0,
                promotion,
                self = this;

            // check if there is a new block generated by FPC placeholder update
            if (this.updatedPromotions.length) {
                pagePromotions = this.updatedPromotions;
            }

            // use the static data otherwise
            if (!pagePromotions.length && this.staticPromotions.length) {
                pagePromotions = this.staticPromotions;
            }

            if ($('[data-banner-id]').length) {
                _.each($('[data-banner-id]'), function (banner) {
                    var $banner = $(banner),
                        ids = ($banner.data('ids') + '').split(',');

                    bannerIds = $.merge(bannerIds, ids);
                });
            }

            bannerIds = $.unique(bannerIds);

            for (i; i < pagePromotions.length; i++) {
                promotion = pagePromotions[i];

                // jscs:disable disallowKeywords
                /* eslint-disable eqeqeq */
                if ($.inArray(promotion.id, bannerIds) == -1 || promotion.activated == '0') {
                    continue;
                }

                // jscs:enable disallowKeywords
                /* eslint-enable eqeqeq */

                dlPromotions.ecommerce.promoView.promotions.push({
                    id: promotion.id,
                    name: promotion.name,
                    creative: promotion.creative,
                    position: promotion.position
                });
                promotionCounter++;
            }

            if (promotionCounter > 0) {
                this.dataLayer.push(dlPromotions);
            }

            $('[data-banner-id]').on('click', '[data-banner-id]', function () {
                var bannerId = $(this).attr('data-banner-id'),
                    promotions = _.filter(pagePromotions, function (item) {
                        return item.id === bannerId;
                    });

                _.each(promotions, function (promotionItem) {
                    self.clickBanner(
                        promotionItem.id,
                        promotionItem.name,
                        promotionItem.creative,
                        promotionItem.position
                    );
                });
            });
        }
    };

    window.GoogleAnalyticsUniversal = GoogleAnalyticsUniversal;
})();
