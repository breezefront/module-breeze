(function () {
    'use strict';

    $.view('wishlistView', {
        component: 'Magento_Wishlist/js/view/wishlist',
        wishlist: $.sections.get('wishlist')
    });

    $.widget('wishlist', {
        component: 'wishlist',
        options: {
            dataAttribute: 'item-id',
            nameFormat: 'qty[{0}]',
            qtySelector: '[data-role=qty]'
        },

        /** Initialize plugin */
        create: function () {
            this._on({
                'click [data-role=tocart]': '_beforeAddToCart',
                'click [data-role=all-tocart]': '_addAllWItemsToCart'
            });
        },

        /**
         * Process data before add to cart
         *
         * - update item's qty value.
         *
         * @param {Event} event
         * @private
         */
        _beforeAddToCart: function (event) {
            var elem = $(event.currentTarget),
                itemId = elem.data(this.options.dataAttribute),
                qtyName = this.options.nameFormat.replace('{0}', itemId),
                qtyValue = elem.parents().find('[name="' + qtyName + '"]').val(),
                params = elem.data('post');

            if (params) {
                params.data = $.extend({}, params.data, {
                    'qty': qtyValue
                });
                elem.data('post', params);
            }
        },

        /**
         * Add all wish list items to cart
         * @private
         */
        _addAllWItemsToCart: function () {
            var urlParams = this.options.addAllToCartUrl,
                separator = urlParams.action.indexOf('?') >= 0 ? '&' : '?';

            this.element.find(this.options.qtySelector).each(function (index, element) {
                urlParams.action += separator + $(element).prop('name') + '=' + encodeURIComponent($(element).val());
                separator = '&';
            });

            $.mage.dataPost().postData(urlParams);
        }
    });

    $.widget('addToWishlist', {
        component: 'addToWishlist',
        options: {
            bundleInfo: 'div.control [name^=bundle_option]',
            configurableInfo: '.super-attribute-select',
            groupedInfo: '#super-product-table input',
            downloadableInfo: '#downloadable-links-list input',
            customOptionsInfo: '.product-custom-option',
            qtyInfo: '#qty',
            actionElement: '[data-action="add-to-wishlist"]',
            productListWrapper: '.product-item-info',
            productPageWrapper: '.product-info-main'
        },

        /** @inheritdoc */
        create: function () {
            var options = this.options,
                dataUpdateFunc = '_updateWishlistData',
                events = {};

            if (options.productType) {
                if (typeof options.productType === 'string') {
                    options.productType = [options.productType];
                }
            } else {
                options.productType = [];
            }

            events['change ' + options.customOptionsInfo] = dataUpdateFunc;
            events['change ' + options.qtyInfo] = dataUpdateFunc;

            $(options.productType).each(function (i, type) {
                var key = type + 'Info';

                if (!options[key]) {
                    return;
                }

                events['change ' + options[key]] = dataUpdateFunc;
            });

            this._on(events);
        },

        /**
         * @param {jQuery.Event} event
         * @private
         */
        _updateWishlistData: function (event) {
            var dataToAdd = {},
                isFileUploaded = false,
                handleObjSelector = null,
                self = this;

            if ($(event.target).is(this.options.qtyInfo)) {
                this._updateAddToWishlistButton({}, event);
                event.stopPropagation();

                return;
            }

            handleObjSelector = $(event.currentTarget).closest('form').find(event.handleObj.selector);

            handleObjSelector.each(function (index, element) {
                if ($(element).is('input[type=text]') ||
                    $(element).is('input[type=email]') ||
                    $(element).is('input[type=number]') ||
                    $(element).is('input[type=hidden]') ||
                    $(element).is('input[type=checkbox]:checked') ||
                    $(element).is('input[type=radio]:checked') ||
                    $(element).is('textarea') ||
                    $('#' + element.id + ' option:checked').length
                ) {
                    if ($(element).data('selector') || $(element).attr('name')) {
                        dataToAdd = $.extend({}, dataToAdd, self._getElementData(element));
                    }

                    return;
                }

                if ($(element).is('input[type=file]') && $(element).val()) {
                    isFileUploaded = true;
                }
            });

            if (isFileUploaded) {
                this.bindFormSubmit();
            }
            this._updateAddToWishlistButton(dataToAdd, event);
            event.stopPropagation();
        },

        /**
         * @param {Object} dataToAdd
         * @param {jQuery.Event} event
         * @private
         */
        _updateAddToWishlistButton: function (dataToAdd, event) {
            var self = this,
                buttons = this._getAddToWishlistButton(event);

            buttons.each(function (index, element) {
                var params = $(element).data('post'),
                    currentTarget = event.currentTarget,
                    targetElement,
                    targetValue;

                if (!params) {
                    params = {
                        'data': {}
                    };
                } else if ($(currentTarget).data('selector') || $(currentTarget).attr('name')) {
                    targetElement = self._getElementData(currentTarget);
                    targetValue = Object.keys(targetElement)[0];

                    if (params.data.hasOwnProperty(targetValue) && !dataToAdd.hasOwnProperty(targetValue)) {
                        delete params.data[targetValue];
                    }
                }

                params.data = $.extend({}, params.data, dataToAdd, {
                    'qty': $(self.options.qtyInfo).val()
                });
                $(element).data('post', params);
            });
        },

        /**
         * @param {jQuery.Event} event
         * @private
         */
        _getAddToWishlistButton: function (event) {
            var productListWrapper = $(event.currentTarget).closest(this.options.productListWrapper);

            if (productListWrapper.length) {
                return productListWrapper.find(this.options.actionElement);
            }

            return $(this.options.actionElement);
        },

        /**
         * @param {HTMLElement} element
         * @return {Object}
         * @private
         */
        _getElementData: function (element) {
            var data, elementName, elementValue;

            element = $(element);
            data = {};
            elementName = element.data('selector') ? element.data('selector') : element.attr('name');
            elementValue = element.val();

            if (element.is('select[multiple]') && elementValue !== null) {
                if (elementName.substr(elementName.length - 2) == '[]') { //eslint-disable-line eqeqeq
                    elementName = elementName.substring(0, elementName.length - 2);
                }
                $.each(elementValue, function (key, option) {
                    data[elementName + '[' + option + ']'] = option;
                });
            } else if (elementName.substr(elementName.length - 2) == '[]') { //eslint-disable-line eqeqeq, max-depth
                elementName = elementName.substring(0, elementName.length - 2);

                data[elementName + '[' + elementValue + ']'] = elementValue;
            } else {
                data[elementName] = elementValue;
            }

            return data;
        },

        /**
         * Bind form submit.
         */
        bindFormSubmit: function () {
            var self = this;

            $('[data-action="add-to-wishlist"]').on('click', function (event) {
                var element, params, form, action;

                event.stopPropagation();
                event.preventDefault();

                element = $('input[type=file]' + self.options.customOptionsInfo);
                params = $(event.currentTarget).data('post');
                form = $(element).closest('form');
                action = params.action;

                if (params.data.id) {
                    $('<input>', {
                        type: 'hidden',
                        name: 'id',
                        value: params.data.id
                    }).appendTo(form);
                }

                if (params.data.uenc) {
                    action += 'uenc/' + params.data.uenc;
                }

                $(form).attr('action', action).trigger('submit');
            });
        }
    });
})();
