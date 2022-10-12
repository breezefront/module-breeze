/* global _ */
(function () {
    'use strict';

    $.widget('slide', {
        component: 'slide',
        options: {
            slideSelector: '#bundle-slide',
            slideBackSelector: '.bundle-slide-back',
            bundleOptionsContainer: '#options-container'
        },

        /** @inheritdoc */
        _create: function () {
            $(this.options.slideSelector).on('click', this._show.bind(this));
            $(this.options.slideBackSelector).on('click', this._hide.bind(this));

            if (this.options.autostart) {
                this._show();
            }
        },

        /**
         * @private
         */
        _show: function () {
            $(this.options.bundleOptionsContainer).show();
            $('html').css('scroll-behavior', 'smooth');
            $('html').scrollTop($(this.options.bundleOptionsContainer).offset().top);
            $('#product-options-wrapper > fieldset').focus();
        },

        /**
         * @private
         */
        _hide: function () {
            $('html').scrollTop(0);
            $(this.options.bundleOptionsContainer).hide();
            $('html').css('scroll-behavior', '');
        }
    });

    $.widget('productSummary', {
        component: 'productSummary',
        options: {
            mainContainer:          '#product_addtocart_form',
            templates: {
                summaryBlock:       '[data-template="bundle-summary"]',
                optionBlock:        '[data-template="bundle-option"]'
            },
            optionSelector:         '[data-container="options"]',
            summaryContainer:       '[data-container="product-summary"]',
            bundleSummaryContainer: '.bundle-summary'
        },
        cache: {},

        /**
         * Method attaches event observer to the product form
         * @private
         */
        _create: function () {
            this.element
                .closest(this.options.mainContainer)
                .on('updateProductSummary', $.proxy(this._renderSummaryBox, this))
                .priceBundle({})
            ;
        },

        /**
         * Method extracts data from the event and renders Summary box
         * using jQuery template mechanism
         * @param {Event} event
         * @param {Object} data
         * @private
         */
        _renderSummaryBox: function (event, data) {
            this.cache.currentElement = data.config;
            this.cache.currentElementCount = 0;

            // Clear Summary box
            this.element.html('');
            this.cache.currentElement.positions.forEach(function (optionId) {
                this._renderOption(optionId, this.cache.currentElement.selected[optionId]);
            }, this);
            this.element
                .parents(this.options.bundleSummaryContainer)
                .toggleClass('empty', !this.cache.currentElementCount); // Zero elements equal '.empty' container
        },

        /**
         * @param {String} key
         * @param {String} row
         * @private
         */
        _renderOption: function (key, row) {
            var template;

            if (row && row.length > 0 && row[0] !== null) {
                template = this.element
                    .closest(this.options.summaryContainer)
                    .find(this.options.templates.summaryBlock)
                    .html();
                template = _.template(template)({
                    data: {
                        _label_: this.cache.currentElement.options[key].title
                    }
                });

                this.cache.currentKey = key;
                this.cache.summaryContainer = $(template);
                this.element.append(this.cache.summaryContainer);

                $.each(row, this._renderOptionRow.bind(this));
                this.cache.currentElementCount += row.length;

                //Reset Cache
                this.cache.currentKey = null;
            }
        },

        /**
         * @param {String} key
         * @param {String} optionIndex
         * @private
         */
        _renderOptionRow: function (key, optionIndex) {
            var template;

            template = this.element
                .closest(this.options.summaryContainer)
                .find(this.options.templates.optionBlock)
                .html();
            template = _.template(template)({
                data: {
                    _quantity_: this.cache.currentElement.options[this.cache.currentKey].selections[optionIndex].qty,
                    _label_: this.cache.currentElement.options[this.cache.currentKey].selections[optionIndex].name
                }
            });
            this.cache.summaryContainer
                .find(this.options.optionSelector)
                .append(template);
        }
    });

    $.widget('priceBundle', {
        component: 'priceBundle',
        options: {
            optionConfig: null,
            productBundleSelector: 'input.bundle.option, select.bundle.option, textarea.bundle.option',
            qtyFieldSelector: 'input.qty',
            priceBoxSelector: '.price-box',
            optionHandlers: {},
            optionTemplate: '<%- data.label %>' +
            '<% if (data.finalPrice.value) { %>' +
            ' +<%- data.finalPrice.formatted %>' +
            '<% } %>',
            controlContainer: 'dd', // should be eliminated
            priceFormat: {},
            isFixedPrice: false,
            optionTierPricesBlocksSelector: '#option-tier-prices-{1} [data-role="selection-tier-prices"]',
            isOptionsInitialized: false
        },

        /**
         * @private
         */
        _create: function () {
            var form = this.element,
                options = $(this.options.productBundleSelector, form),
                priceBox = $(this.options.priceBoxSelector, form),
                qty = $(this.options.qtyFieldSelector, form);

            this._updatePriceBox();
            priceBox.on('price-box-initialized', this._updatePriceBox.bind(this));
            options.on('change', this._onBundleOptionChanged.bind(this));
            qty.on('change', this._onQtyFieldChanged.bind(this));

            priceBox.on('price-box-initialized', function () {
                options.trigger('change');
            });
        },

        /**
         * Update price box config with bundle option prices
         * @private
         */
        _updatePriceBox: function () {
            var form = this.element,
                options = $(this.options.productBundleSelector, form),
                priceBox = $(this.options.priceBoxSelector, form);

            if (!this.options.isOptionsInitialized) {
                if (priceBox.data('magePriceBox') &&
                    priceBox.priceBox('option') &&
                    priceBox.priceBox('option').priceConfig
                ) {
                    if (priceBox.priceBox('option').priceConfig.optionTemplate) { //eslint-disable-line max-depth
                        this._setOption('optionTemplate', priceBox.priceBox('option').priceConfig.optionTemplate);
                    }
                    this._setOption('priceFormat', priceBox.priceBox('option').priceConfig.priceFormat);
                    priceBox.priceBox('setDefault', this.options.optionConfig.prices);
                    this.options.isOptionsInitialized = true;
                }
                this._applyOptionNodeFix(options);
            }

            return this;
        },

        /**
         * Handle change on bundle option inputs
         * @param {jQuery.Event} event
         * @private
         */
        _onBundleOptionChanged: function (event) {
            var changes,
                bundleOption = $(event.target),
                priceBox = $(this.options.priceBoxSelector, this.element),
                handler = this.options.optionHandlers[bundleOption.data('role')];

            bundleOption.data('optionContainer', bundleOption.closest(this.options.controlContainer));
            bundleOption.data('qtyField', bundleOption.data('optionContainer').find(this.options.qtyFieldSelector));

            if (handler && handler instanceof Function) {
                changes = handler(bundleOption, this.options.optionConfig, this);
            } else {
                changes = defaultGetOptionValue(bundleOption, this.options.optionConfig);//eslint-disable-line
            }

            if (changes) {
                priceBox.trigger('updatePrice', changes);
            }

            this._displayTierPriceBlock(bundleOption);
            this.updateProductSummary();
        },

        /**
         * Handle change on qty inputs near bundle option
         * @param {jQuery.Event} event
         * @private
         */
        _onQtyFieldChanged: function (event) {
            var field = $(event.target),
                optionInstance,
                optionConfig;

            if (field.data('optionId') && field.data('optionValueId')) {
                optionInstance = field.data('option');
                optionConfig = this.options.optionConfig
                    .options[field.data('optionId')]
                    .selections[field.data('optionValueId')];
                optionConfig.qty = field.val();

                optionInstance.trigger('change');
            }
        },

        /** [_applyQtyFix description] */
        _applyQtyFix: function () {
            var config = this.options.optionConfig;

            if (config.isFixedPrice) {
                _.each(config.options, function (option) {
                    _.each(option.selections, function (item) {
                        if (item.qty && item.qty !== 1) {
                            _.each(item.prices, function (price) {
                                price.amount /= item.qty;
                            });
                        }
                    });
                });
            }
        },

        /** [_applyOptionNodeFix description] */
        _applyOptionNodeFix: function (options) {
            var config = this.options,
                format = config.priceFormat,
                template = config.optionTemplate;

            template = _.template(template);
            options.filter('select').each(function (index, element) {
                var $element = $(element),
                    optionId = $.catalog.priceUtils.findOptionId($element),
                    optionConfig = config.optionConfig && config.optionConfig.options[optionId].selections,
                    value;

                $element.find('option').each(function (idx, option) {
                    var $option,
                        optionValue,
                        toTemplate,
                        prices;

                    $option = $(option);
                    optionValue = $option.val();

                    if (!optionValue && optionValue !== 0) {
                        return;
                    }

                    toTemplate = {
                        data: {
                            label: optionConfig[optionValue] && optionConfig[optionValue].name
                        }
                    };
                    prices = optionConfig[optionValue].prices;

                    _.each(prices, function (price, type) {
                        value = +price.amount;
                        value += _.reduce(price.adjustments, function (sum, x) {//eslint-disable-line
                            return sum + x;
                        }, 0);
                        toTemplate.data[type] = {
                            value: value,
                            formatted: $.catalog.priceUtils.formatPrice(value, format)
                        };
                    });

                    $option.html(template(toTemplate));
                });
            });
        },

        /** [_setOptions description] */
        _setOptions: function (options) {
            $.extend(true, this.options, options);

            this._super(options);

            return this;
        },

        /** [_displayTierPriceBlock description] */
        _displayTierPriceBlock: function (optionElement) {
            var optionType = optionElement.prop('type'),
                optionId,
                optionValue,
                optionTierPricesElements;

            if (optionType === 'select-one') {
                optionId = $.catalog.priceUtils.findOptionId(optionElement[0]);
                optionValue = optionElement.val() || null;
                optionTierPricesElements = $(this.options.optionTierPricesBlocksSelector.replace('{1}', optionId));

                _.each(optionTierPricesElements, function (tierPriceElement) {
                    var selectionId = $(tierPriceElement).data('selection-id') + '';

                    if (selectionId === optionValue) {
                        $(tierPriceElement).show();
                    } else {
                        $(tierPriceElement).hide();
                    }
                });
            }
        },

        /** [updateProductSummary description] */
        updateProductSummary: function () {
            this.element.trigger('updateProductSummary', {
                config: this.options.optionConfig
            });
        }
    });

    /**
     * Converts option value to priceBox object
     *
     * @param   {jQuery} element
     * @param   {Object} config
     * @returns {Object|null} - priceBox object with additional prices
     */
    function defaultGetOptionValue(element, config) {
        var changes = {},
            optionHash,
            tempChanges,
            qtyField,
            optionId = $.catalog.priceUtils.findOptionId(element[0]),
            optionValue = element.val() || null,
            optionName = element.prop('name'),
            optionType = element.prop('type'),
            optionConfig = config.options[optionId].selections,
            optionQty = 0,
            canQtyCustomize = false,
            selectedIds = config.selected;

        switch (optionType) {
            case 'radio':
            case 'select-one':

                if (optionType === 'radio' && !element.is(':checked')) {
                    return null;
                }

                qtyField = element.data('qtyField');
                qtyField.data('option', element);

                if (optionValue) {
                    optionQty = optionConfig[optionValue].qty || 0;
                    canQtyCustomize = optionConfig[optionValue].customQty === '1';
                    toggleQtyField(qtyField, optionQty, optionId, optionValue, canQtyCustomize);//eslint-disable-line
                    tempChanges = $.catalog.priceUtils.deepClone(optionConfig[optionValue].prices);
                    tempChanges = applyTierPrice(//eslint-disable-line
                        tempChanges,
                        optionQty,
                        optionConfig[optionValue]
                    );
                    tempChanges = applyQty(tempChanges, optionQty);//eslint-disable-line
                } else {
                    tempChanges = {};
                    toggleQtyField(qtyField, '0', optionId, optionValue, false);//eslint-disable-line
                }
                optionHash = 'bundle-option-' + optionName;
                changes[optionHash] = tempChanges;
                selectedIds[optionId] = [optionValue];
                break;

            case 'select-multiple':
                optionValue = _.compact(optionValue);

                _.each(optionConfig, function (row, optionValueCode) {
                    optionHash = 'bundle-option-' + optionName + '##' + optionValueCode;
                    optionQty = row.qty || 0;
                    tempChanges = $.catalog.priceUtils.deepClone(row.prices);
                    tempChanges = applyTierPrice(tempChanges, optionQty, optionConfig);//eslint-disable-line
                    tempChanges = applyQty(tempChanges, optionQty);//eslint-disable-line
                    changes[optionHash] = _.contains(optionValue, optionValueCode) ? tempChanges : {};
                });

                selectedIds[optionId] = optionValue || [];
                break;

            case 'checkbox':
                optionHash = 'bundle-option-' + optionName + '##' + optionValue;
                optionQty = optionConfig[optionValue].qty || 0;
                tempChanges = $.catalog.priceUtils.deepClone(optionConfig[optionValue].prices);
                tempChanges = applyTierPrice(tempChanges, optionQty, optionConfig);//eslint-disable-line
                tempChanges = applyQty(tempChanges, optionQty);//eslint-disable-line
                changes[optionHash] = element.is(':checked') ? tempChanges : {};

                selectedIds[optionId] = selectedIds[optionId] || [];

                if (!_.contains(selectedIds[optionId], optionValue) && element.is(':checked')) {
                    selectedIds[optionId].push(optionValue);
                } else if (!element.is(':checked')) {
                    selectedIds[optionId] = _.without(selectedIds[optionId], optionValue);
                }
                break;

            case 'hidden':
                optionHash = 'bundle-option-' + optionName + '##' + optionValue;
                optionQty = optionConfig[optionValue].qty || 0;
                canQtyCustomize = optionConfig[optionValue].customQty === '1';
                qtyField = element.data('qtyField');
                qtyField.data('option', element);
                toggleQtyField(qtyField, optionQty, optionId, optionValue, canQtyCustomize);//eslint-disable-line
                tempChanges = $.catalog.priceUtils.deepClone(optionConfig[optionValue].prices);
                tempChanges = applyTierPrice(tempChanges, optionQty, optionConfig);//eslint-disable-line
                tempChanges = applyQty(tempChanges, optionQty);//eslint-disable-line

                optionHash = 'bundle-option-' + optionName;
                changes[optionHash] = tempChanges;
                selectedIds[optionId] = [optionValue];
                break;
        }

        return changes;
    }

    /**
     * Helper to toggle qty field
     * @param {jQuery} element
     * @param {String|Number} value
     * @param {String|Number} optionId
     * @param {String|Number} optionValueId
     * @param {Boolean} canEdit
     */
    function toggleQtyField(element, value, optionId, optionValueId, canEdit) {
        element
            .val(value)
            .data('optionId', optionId)
            .data('optionValueId', optionValueId)
            .prop('disabled', !canEdit);

        if (canEdit) {
            element.removeClass('qty-disabled');
        } else {
            element.addClass('qty-disabled');
        }
    }

    /**
     * Helper to multiply on qty
     *
     * @param   {Object} prices
     * @param   {Number} qty
     * @returns {Object}
     */
    function applyQty(prices, qty) {
        _.each(prices, function (everyPrice) {
            everyPrice.amount *= qty;
            _.each(everyPrice.adjustments, function (el, index) {
                everyPrice.adjustments[index] *= qty;
            });
        });

        return prices;
    }

    /**
     * Helper to limit price with tier price
     *
     * @param {Object} oneItemPrice
     * @param {Number} qty
     * @param {Object} optionConfig
     * @returns {Object}
     */
    function applyTierPrice(oneItemPrice, qty, optionConfig) {
        var tiers = optionConfig.tierPrice,
            magicKey = _.keys(oneItemPrice)[0],
            tiersFirstKey = _.keys(optionConfig)[0],
            lowest = false;

        if (!tiers) {//tiers is undefined when options has only one option
            tiers = optionConfig[tiersFirstKey].tierPrice;
        }

        tiers.sort(function (a, b) {//sorting based on "price_qty"
            return a['price_qty'] - b['price_qty'];
        });

        _.each(tiers, function (tier, index) {
            if (tier['price_qty'] > qty) {
                return;
            }

            if (tier.prices[magicKey].amount < oneItemPrice[magicKey].amount) {
                lowest = index;
            }
        });

        if (lowest !== false) {
            oneItemPrice = $.catalog.priceUtils.deepClone(tiers[lowest].prices);
        }

        return oneItemPrice;
    }
})();
