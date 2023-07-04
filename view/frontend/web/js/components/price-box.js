(function () {
    'use strict';

    var globalOptions = {
        productId: null,
        priceConfig: null,
        prices: {},
        priceTemplate: '<span class="price"><%- data.formatted %></span>'
    };

    $.widget('priceBox', {
        component: 'priceBox',
        options: globalOptions,
        qtyInfo: '#qty',

        /**
         * Widget initialisation.
         * Every time when option changed prices also can be changed. So
         * changed options.prices -> changed cached prices -> recalculation -> redraw price box
         */
        _init: function () {
            var box = this.element;

            box.trigger('updatePrice');
            this.cache.displayPrices = $.catalog.priceUtils.deepClone(this.options.prices);
        },

        _create: function () {
            var box = this.element;

            this.cache = {};
            this._setDefaultsFromPriceConfig();
            this._setDefaultsFromDataSet();

            box.on('reloadPrice', this.reloadPrice.bind(this));
            box.on('updatePrice', this.onUpdatePrice.bind(this));
            $(this.qtyInfo).on('input', this.updateProductTierPrice.bind(this));

            setTimeout(() => {
                box.trigger('price-box-initialized');
            });
        },

        /**
         * Call on event updatePrice. Proxy to updatePrice method.
         * @param {Event} event
         * @param {Object} prices
         */
        onUpdatePrice: function (event, prices) {
            return this.updatePrice(prices);
        },

        /**
         * Updates price via new (or additional values).
         * It expects object like this:
         * -----
         *   "option-hash":
         *      "price-code":
         *         "amount": 999.99999,
         *         ...
         * -----
         * Empty option-hash object or empty price-code object treats as zero amount.
         * @param {Object} newPrices
         */
        updatePrice: function (newPrices) {
            var prices = this.cache.displayPrices,
                additionalPrice = {},
                pricesCode = [],
                priceValue, origin, finalPrice;

            this.cache.additionalPriceObject = this.cache.additionalPriceObject || {};

            if (newPrices) {
                $.extend(this.cache.additionalPriceObject, newPrices);
            }

            if (!_.isEmpty(additionalPrice)) {
                pricesCode = _.keys(additionalPrice);
            } else if (!_.isEmpty(prices)) {
                pricesCode = _.keys(prices);
            }

            _.each(this.cache.additionalPriceObject, function (additional) {
                if (additional && !_.isEmpty(additional)) {
                    pricesCode = _.keys(additional);
                }
                _.each(pricesCode, function (priceCode) {
                    priceValue = additional[priceCode] || {};
                    priceValue.amount = +priceValue.amount || 0;
                    priceValue.adjustments = priceValue.adjustments || {};

                    additionalPrice[priceCode] = additionalPrice[priceCode] || {
                            'amount': 0,
                            'adjustments': {}
                        };
                    additionalPrice[priceCode].amount =  0 + (additionalPrice[priceCode].amount || 0) +
                        priceValue.amount;
                    // eslint-disable-next-line max-nested-callbacks
                    _.each(priceValue.adjustments, function (adValue, adCode) {
                        additionalPrice[priceCode].adjustments[adCode] = 0 +
                            (additionalPrice[priceCode].adjustments[adCode] || 0) + adValue;
                    });
                });
            });

            if (_.isEmpty(additionalPrice)) {
                this.cache.displayPrices = $.catalog.priceUtils.deepClone(this.options.prices);
            } else {
                _.each(additionalPrice, function (option, priceCode) {
                    origin = this.options.prices[priceCode] || {};
                    finalPrice = prices[priceCode] || {};
                    option.amount = option.amount || 0;
                    origin.amount = origin.amount || 0;
                    origin.adjustments = origin.adjustments || {};
                    finalPrice.adjustments = finalPrice.adjustments || {};

                    finalPrice.amount = 0 + origin.amount + option.amount;
                    _.each(option.adjustments, function (pa, paCode) {
                        finalPrice.adjustments[paCode] = 0 + (origin.adjustments[paCode] || 0) + pa;
                    });
                }, this);
            }

            this.element.trigger('priceUpdated', this.cache.displayPrices);
            this.element.trigger('reloadPrice');
        },

        /*eslint-disable no-extra-parens*/
        reloadPrice: function () {
            var priceFormat = (this.options.priceConfig && this.options.priceConfig.priceFormat) || {},
                priceTemplate = _.template(this.options.priceTemplate);

            _.each(this.cache.displayPrices, function (price, priceCode) {
                price.final = _.reduce(price.adjustments, function (memo, amount) {
                    return memo + amount;
                }, price.amount);

                price.formatted = $.catalog.priceUtils.formatPrice(price.final, priceFormat);

                $('[data-price-type="' + priceCode + '"]', this.element).html(priceTemplate({
                    data: price
                }));
            }, this);
        },

        setDefault: function (prices) {
            this.cache.displayPrices = $.catalog.priceUtils.deepClone(prices);
            this.options.prices = $.catalog.priceUtils.deepClone(prices);
        },

        _setDefaultsFromDataSet: function () {
            var box = this.element,
                priceHolders = $('[data-price-type]', box),
                prices = this.options.prices;

            this.options.productId = box.data('productId');

            if (_.isEmpty(prices)) {
                priceHolders.each(function (index, element) {
                    var type = $(element).data('priceType'),
                        amount = parseFloat($(element).data('priceAmount'));

                    if (type && !_.isNaN(amount)) {
                        prices[type] = {
                            amount: amount
                        };
                    }
                });
            }
        },

        _setDefaultsFromPriceConfig: function () {
            var config = this.options.priceConfig;

            if (config && config.prices) {
                this.options.prices = config.prices;
            }
        },

        updateProductTierPrice: function () {
            var originalPrice,
                prices = {'prices': {}};

            if (this.options.prices.finalPrice) {
                originalPrice = this.options.prices.finalPrice.amount;
                prices.prices.finalPrice = {'amount': this.getPrice('price') - originalPrice};
            }

            if (this.options.prices.basePrice) {
                originalPrice = this.options.prices.basePrice.amount;
                prices.prices.basePrice = {'amount': this.getPrice('basePrice') - originalPrice};
            }

            this.updatePrice(prices);
        },

        getPrice: function (priceKey) {
            var productQty = $(this.qtyInfo).val(),
                result,
                tierPriceItem,
                i;

            for (i = 0; i < this.options.priceConfig.tierPrices.length; i++) {
                tierPriceItem = this.options.priceConfig.tierPrices[i];
                if (productQty >= tierPriceItem.qty && tierPriceItem[priceKey]) {
                    result = tierPriceItem[priceKey];
                }
            }

            return result;
        }
    });
})();
