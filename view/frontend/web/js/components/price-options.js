define([
    'Magento_Catalog/js/price-utils'
], function (priceUtils) {
    'use strict';

    var globalOptions = {
        productId: null,
        priceHolderSelector: '.price-box', //data-role="priceBox"
        optionsSelector: '.product-custom-option',
        optionConfig: {},
        optionHandlers: {},
        optionTemplate: '<%= data.label %>' +
        '<% if (data.finalPrice.value > 0) { %>' +
        ' +<%- data.finalPrice.formatted %>' +
        '<% } else if (data.finalPrice.value < 0) { %>' +
        ' <%- data.finalPrice.formatted %>' +
        '<% } %>',
        controlContainer: 'dd'
    };

    /**
     * Custom option preprocessor
     * @param  {jQuery} element
     * @param  {Object} optionsConfig - part of config
     * @return {Object}
     */
    function defaultGetOptionValue(element, optionsConfig) {
        var changes = {},
            optionValue = element.val(),
            optionId = priceUtils.findOptionId(element[0]),
            optionName = element.prop('name'),
            optionType = element.prop('type'),
            optionConfig = optionsConfig[optionId],
            optionHash = optionName;

        switch (optionType) {
            case 'text':
            case 'textarea':
                changes[optionHash] = optionValue ? optionConfig.prices : {};
                break;

            case 'radio':
                if (element.is(':checked')) {
                    changes[optionHash] = optionConfig[optionValue] && optionConfig[optionValue].prices || {};
                }
                break;

            case 'select-one':
                changes[optionHash] = optionConfig[optionValue] && optionConfig[optionValue].prices || {};
                break;

            case 'select-multiple':
                _.each(optionConfig, function (row, optionValueCode) {
                    optionHash = optionName + '##' + optionValueCode;
                    changes[optionHash] = _.contains(optionValue, optionValueCode) ? row.prices : {};
                });
                break;

            case 'checkbox':
                optionHash = optionName + '##' + optionValue;
                changes[optionHash] = element.is(':checked') ? optionConfig[optionValue].prices : {};
                break;

            case 'file':
                // Checking for 'disable' property equal to checking DOMNode with id*="change-"
                changes[optionHash] = optionValue || element.prop('disabled') ? optionConfig.prices : {};
                break;
        }

        return changes;
    }

    $.widget('priceOptions', {
        component: 'priceOptions',
        options: globalOptions,

        _init: function () {
            var priceBox = $(this.options.priceHolderSelector, $(this.options.optionsSelector).element);

            if (priceBox.priceBox('instance')) {
                $(this.options.optionsSelector, this.element).trigger('change');
            } else {
                priceBox.on('price-box-initialized', () => {
                    $(this.options.optionsSelector, this.element).trigger('change');
                });
            }
        },

        _create: function () {
            var form = this.element,
                options = $(this.options.optionsSelector, form),
                priceBox = $(this.options.priceHolderSelector, $(this.options.optionsSelector).element);

            if (priceBox.priceBox('instance')) {
                this._onPriceFormatReady(priceBox);
            } else {
                priceBox.on('price-box-initialized', function () {
                    this._onPriceFormatReady(priceBox);
                }.bind(this));
            }

            options.on('change', this._onOptionChanged.bind(this));
        },

        _onPriceFormatReady: function (priceBox) {
            var options = $(this.options.optionsSelector, this.element),
                priceConfig = priceBox.priceBox('option').priceConfig;

            if (priceConfig) {
                if (priceConfig.optionTemplate) {
                    this._setOption('optionTemplate', priceConfig.optionTemplate);
                }
                this._setOption('priceFormat', priceConfig.priceFormat);
            }

            this._applyOptionNodeFix(options);
        },

        /**
         * Custom option change-event handler
         * @param {Event} event
         * @private
         */
        _onOptionChanged: function (event) {
            var changes,
                option = $(event.target),
                handler = this.options.optionHandlers[option.data('role')];

            option.data('optionContainer', option.closest(this.options.controlContainer));

            if (handler && handler instanceof Function) {
                changes = handler(option, this.options.optionConfig, this);
            } else {
                changes = defaultGetOptionValue(option, this.options.optionConfig);
            }
            $(this.options.priceHolderSelector).trigger('updatePrice', changes);
        },

        /**
         * Helper to fix issue with option nodes:
         *  - you can't place any html in option ->
         *    so you can't style it via CSS
         * @param {jQuery} options
         * @private
         */
        _applyOptionNodeFix: function (options) {
            var config = this.options,
                format = config.priceFormat,
                template = config.optionTemplate;

            template = _.template(template);
            options.filter('select').each(function (index, element) {
                var $element = $(element),
                    optionId = priceUtils.findOptionId($element),
                    optionConfig = config.optionConfig && config.optionConfig[optionId];

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
                    prices = optionConfig[optionValue] ? optionConfig[optionValue].prices : null;

                    if (prices) {
                        _.each(prices, function (price, type) {
                            var value = +price.amount;

                            value += _.reduce(price.adjustments, function (sum, x) { //eslint-disable-line
                                return sum + x;
                            }, 0);
                            toTemplate.data[type] = {
                                value: value,
                                formatted: priceUtils.formatPrice(value, format)
                            };
                        });

                        $option.text(template(toTemplate));
                    }
                });
            });
        }
    });
});
