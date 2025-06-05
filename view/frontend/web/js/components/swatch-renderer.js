define([
    'jquery',
    'underscore',
    'mage/template',
    'mage/translate',
    'priceUtils'
], function ($, _, mageTemplate, $t, priceUtils) {
    'use strict';

    var $element = $(),
        $image,
        $title,
        $corner;

    $.widget('mage.SwatchRendererTooltip', {
        options: {
            delay: 200,
            tooltipClass: 'swatch-option-tooltip'
        },

        _init: function () {
            var $widget = this,
                $this = this.element,
                timer, type, label, thumb, value, width, height;

            function prepareMarkup() {
                $element = $('.' + $widget.options.tooltipClass);

                if ($element.length) {
                    return;
                }

                $element = $('<div style="display:none" class="' +
                    $widget.options.tooltipClass +
                    '"><div class="image"></div><div class="title"></div><div class="corner"></div></div>'
                );
                $('body').append($element);

                $image = $element.find('.image');
                $title = $element.find('.title');
                $corner = $element.find('.corner');
            }

            $this.hover(function () {
                if ($this.hasClass('disabled')) {
                    return;
                }

                if (!$element.length) {
                    prepareMarkup();
                }

                if (type === undefined) {
                    type = parseInt($this.data('option-type'), 10);
                    label = $this.data('option-label');
                    thumb = $this.data('option-tooltip-thumb');
                    value = $this.data('option-tooltip-value');
                    width = $this.data('thumb-width');
                    height = $this.data('thumb-height');
                }

                timer = setTimeout(function () {
                    var leftOpt = null,
                        leftCorner = 0,
                        left,
                        $window;

                    if (type === 2) {
                        // Image
                        $image.css({
                            'background': 'url("' + thumb + '") no-repeat center', //Background case
                            'background-size': 'initial',
                            'width': width + 'px',
                            'height': height + 'px'
                        });
                        $image.show();
                    } else if (type === 1) {
                        // Color
                        $image.css({
                            background: value
                        });
                        $image.show();
                    } else if (type === 0 || type === 3) {
                        // Default
                        $image.hide();
                    }

                    $title.text(label);
                    $element.show();

                    leftOpt = $this.offset().left;
                    left = leftOpt + $this.width() / 2 - $element.width() / 2;
                    $window = $(window);

                    // the numbers (5 and 5) is magick constants for offset from left or right page
                    if (left < 0) {
                        left = 5;
                    } else if (left + $element.width() > $window.width()) {
                        left = $window.width() - $element.width() - 5;
                    }

                    // the numbers (6,  3 and 18) is magick constants for offset tooltip
                    leftCorner = 0;

                    if ($element.width() < $this.width()) {
                        leftCorner = $element.width() / 2 - 3;
                    } else {
                        leftCorner = (leftOpt > left ? leftOpt - left : left - leftOpt) + $this.width() / 2 - 6;
                    }

                    $corner.css({
                        left: leftCorner
                    });
                    $element.css({
                        left: left,
                        top: $this.offset().top - $element.height() - $corner.height() - 18
                    }).show();
                }, $widget.options.delay);
            }, function () {
                $element.hide();
                clearTimeout(timer);
            });

            $(document).on('tap.SwatchRendererTooltip', function () {
                $element.hide();
                clearTimeout(timer);
            });

            $this.on('tap', function (event) {
                event.stopPropagation();
            });
        },

        destroy: function () {
            $(document).off('tap.SwatchRendererTooltip');
            this._super();
        }
    });

    $.widget('mage.SwatchRenderer', {
        component: 'Magento_Swatches/js/swatch-renderer',
        options: {
            classes: {
                attributeClass: 'swatch-attribute',
                attributeLabelClass: 'swatch-attribute-label',
                attributeSelectedOptionLabelClass: 'swatch-attribute-selected-option',
                attributeOptionsWrapper: 'swatch-attribute-options',
                attributeInput: 'swatch-input',
                optionClass: 'swatch-option',
                selectClass: 'swatch-select',
                moreButton: 'swatch-more',
                loader: 'swatch-option-loading'
            },
            // option's json config
            jsonConfig: {},

            // swatch's json config
            jsonSwatchConfig: {},

            // selector of parental block of prices and swatches (need to know where to seek for price block)
            selectorProduct: '.product-info-main',

            // selector of price wrapper (need to know where set price)
            selectorProductPrice: '[data-role=priceBox]',

            //selector of product images gallery wrapper
            mediaGallerySelector: '[data-gallery-role=gallery-placeholder]',

            // selector of category product tile wrapper
            selectorProductTile: '.product-item',

            // number of controls to show (false or zero = show all)
            numberToShow: false,

            // show only swatch controls
            onlySwatches: false,

            // enable label for control
            enableControlLabel: true,

            // control label id
            controlLabelId: '',

            // text for more button
            moreButtonText: $t('More'),

            // Callback url for media
            mediaCallback: '',

            // Local media cache
            mediaCache: {},

            // Cache for BaseProduct images. Needed when option unset
            mediaGalleryInitial: [{}],

            // Use ajax to get image data
            useAjax: false,

            /**
             * Defines the mechanism of how images of a gallery should be
             * updated when user switches between configurations of a product.
             *
             * As for now value of this option can be either 'replace' or 'prepend'.
             *
             * @type {String}
             */
            gallerySwitchStrategy: 'replace',

            // whether swatches are rendered in product list or on product page
            inProductList: false,

            // sly-old-price block selector
            slyOldPriceSelector: '.sly-old-price',

            // tier prise selectors start
            tierPriceTemplateSelector: '#tier-prices-template',
            tierPriceBlockSelector: '[data-role="tier-price-block"]',
            tierPriceTemplate: '',
            // tier prise selectors end

            // A price label selector
            normalPriceLabelSelector: '.normal-price .price-label',
            qtyInfo: '#qty'
        },

        /**
         * Get chosen product
         *
         * @returns int|null
         */
        getProduct: function () {
            var products = this._CalcProducts();

            return _.isArray(products) ? products[0] : null;
        },

        /**
         * Get chosen product id
         *
         * @returns int|null
         */
        getProductId: function () {
            var products = this._CalcProducts();

            return _.isArray(products) && products.length === 1 ? products[0] : null;
        },

        /**
         * @private
         */
        _init: function () {
            if ($(this.element).attr('data-rendered')) {
                return;
            }

            this._markup = this.element.html();
            $(this.element).attr('data-rendered', true);
            this.onReveal(this._initAsVisible.bind(this));
        },

        _initAsVisible: function () {
            if (_.isEmpty(this.options.jsonConfig.images)) {
                this.options.useAjax = true;
                this._debouncedLoadProductMedia = _.debounce(this._LoadProductMedia.bind(this), 500);
            }

            this.options.tierPriceTemplate = $(this.options.tierPriceTemplateSelector).html();

            if (this.options.jsonConfig !== '' && this.options.jsonSwatchConfig !== '') {
                this.options.jsonConfig.mappedAttributes = _.clone(this.options.jsonConfig.attributes);
                this._sortAttributes();
                this._RenderControls();
                this._setPreSelectedGallery();
                $(this.element).trigger('swatch.initialized');
            } else {
                console.log('SwatchRenderer: No input data received');
            }
        },

        destroy: function () {
            $(this.element).removeAttr('data-rendered').html(this._markup);
            this._super();
        },

        _sortAttributes: function () {
            this.options.jsonConfig.attributes = _.sortBy(this.options.jsonConfig.attributes, function (attribute) {
                return parseInt(attribute.position, 10);
            });
        },

        _create: function () {
            var options = this.options,
                gallery = $('[data-gallery-role=gallery-placeholder]', '.column.main'),
                productData = this._determineProductData(),
                $main = productData.isInProductView ?
                    this.element.parents('.column.main') :
                    this.element.parents('.product-item-info');

            if (productData.isInProductView) {
                gallery.gallery?.('instance') ?
                    this._onGalleryLoaded(gallery) :
                    gallery.on('gallery:loaded', this._onGalleryLoaded.bind(this, gallery));
            } else {
                options.mediaGalleryInitial = [{
                    'img': $main.find('.product-image-photo').attr('src')
                }];
            }

            this.productForm = this.element.parents(this.options.selectorProductTile).find('form').first();
            this.inProductList = this.productForm.length > 0;
            $(this.options.qtyInfo).on('input', () => _.defer(this._onQtyChanged.bind(this)));
        },

        /**
         * @returns {{productId: *, isInProductView: bool}}
         */
        _determineProductData: function () {
            // Check if product is in a list of products.
            var productId,
                isInProductView = false;

            productId = this.element.parents('.product-item-details, .product-item-info')
                .find('.price-box.price-final_price').attr('data-product-id');

            if (!productId) {
                // Check individual product.
                productId = $('[name=product]').val();
                isInProductView = productId > 0;
            }

            return {
                productId: productId,
                isInProductView: isInProductView
            };
        },

        _RenderControls: function () {
            var $widget = this,
                container = this.element,
                classes = this.options.classes,
                chooseText = this.options.jsonConfig.chooseText,
                showTooltip = this.options.showTooltip;

            $widget.optionsMap = {};

            $.each(this.options.jsonConfig.attributes, function () {
                var item = this,
                    controlLabelId = 'option-label-' + item.code + '-' + item.id,
                    options = $widget._RenderSwatchOptions(item, controlLabelId),
                    select = $widget._RenderSwatchSelect(item, chooseText),
                    input = $widget._RenderFormInput(item),
                    listLabel = '',
                    label = '';

                // Show only swatch controls
                if ($widget.options.onlySwatches && !$widget.options.jsonSwatchConfig.hasOwnProperty(item.id)) {
                    return;
                }

                if ($widget.options.enableControlLabel) {
                    label +=
                        '<span id="' + controlLabelId + '" class="' + classes.attributeLabelClass + '">' +
                        $('<i></i>').text(item.label).html() +
                        '</span>' +
                        '<span class="' + classes.attributeSelectedOptionLabelClass + '"></span>';
                }

                if ($widget.inProductList) {
                    $widget.productForm.append(input);
                    input = '';
                    listLabel = 'aria-label="' + $('<i></i>').text(item.label).html() + '"';
                } else {
                    listLabel = 'aria-labelledby="' + controlLabelId + '"';
                }

                // Create new control
                container.append(
                    '<div class="' + classes.attributeClass + ' ' + item.code + '" ' +
                         'data-attribute-code="' + item.code + '" ' +
                         'data-attribute-id="' + item.id + '">' +
                        label +
                        '<div aria-activedescendant="" ' +
                             'aria-invalid="false" ' +
                             'aria-required="true" ' +
                             'role="listbox" ' + listLabel +
                             'class="' + classes.attributeOptionsWrapper + ' clearfix">' +
                            options + select +
                        '</div>' + input +
                    '</div>'
                );

                $widget.optionsMap[item.id] = {};

                // Aggregate options array to hash (key => value)
                $.each(item.options, function () {
                    if (this.products.length > 0) {
                        let salableProducts = this.products;

                        if ($widget.options.jsonConfig.canDisplayShowOutOfStockStatus) {
                            salableProducts = $widget.options.jsonConfig.salable[item.id][this.id];
                        }
                        $widget.optionsMap[item.id][this.id] = {
                            price: parseInt(
                                $widget.options.jsonConfig.optionPrices[this.products[0]].finalPrice.amount,
                                10
                            ),
                            products: salableProducts
                        };
                    }
                });
            });

            if (showTooltip === 1) {
                // Connect Tooltip
                container
                    .find('[data-option-type="1"], [data-option-type="2"],' +
                        ' [data-option-type="0"], [data-option-type="3"]')
                    .SwatchRendererTooltip();
            }

            // Hide all elements below more button
            $('.' + classes.moreButton).nextAll().hide();

            container.find('.breeze-placeholder').remove();
            container.find('.' + classes.attributeOptionsWrapper).a11y('selectable');

            // Handle events like click or change
            $widget._EventListener();

            // Rewind options
            $widget._Rewind(container);

            // timout is used to wait till price-box widget will be mounted
            setTimeout(function () {
                $widget._EmulateSelected($.parseQuery());
                $widget._EmulateSelected($widget._getSelectedAttributes());
            }, 80);
        },

        disableSwatchForOutOfStockProducts: function () {
            let $widget = this, container = this.element;

            $.each(this.options.jsonConfig.attributes, function () {
                let item = this;

                if ($widget.options.jsonConfig.canDisplayShowOutOfStockStatus) {
                    let salableProducts = $widget.options.jsonConfig.salable[item.id],
                        swatchOptions = $(container).find(`[data-attribute-id='${item.id}']`).find('.swatch-option');

                    swatchOptions.each(function (key, value) {
                        let optionId = $(value).data('option-id');

                        if (!salableProducts.hasOwnProperty(optionId)) {
                            $(value).attr('disabled', true).addClass('disabled');
                        }
                    });
                }
            });
        },

        /**
         * Render swatch options by part of config
         *
         * @param {Object} config
         * @param {String} controlId
         * @returns {String}
         * @private
         */
        _RenderSwatchOptions: function (config, controlId) {
            var $widget = this,
                optionConfig = this.options.jsonSwatchConfig[config.id],
                optionClass = this.options.classes.optionClass,
                sizeConfig = this.options.jsonSwatchImageSizeConfig,
                moreLimit = parseInt(this.options.numberToShow, 10),
                moreClass = this.options.classes.moreButton,
                moreText = this.options.moreButtonText,
                countAttributes = 0,
                html = '';

            if (!this.options.jsonSwatchConfig.hasOwnProperty(config.id)) {
                return '';
            }

            $.each(config.options, function (index) {
                var id,
                    type,
                    value,
                    thumb,
                    label,
                    width,
                    height,
                    attr,
                    swatchImageWidth,
                    swatchImageHeight;

                if (!optionConfig.hasOwnProperty(this.id)) {
                    return '';
                }

                // Add more button
                if (moreLimit === countAttributes++) {
                    html += '<a href="#" class="' + moreClass + '"><span>' + moreText + '</span></a>';
                }

                id = this.id;
                type = parseInt(optionConfig[id].type, 10);
                value = optionConfig[id].hasOwnProperty('value') ?
                    $('<i></i>').text(optionConfig[id].value).html() : '';
                thumb = optionConfig[id].hasOwnProperty('thumb') ? optionConfig[id].thumb : '';
                width = _.has(sizeConfig, 'swatchThumb') ? sizeConfig.swatchThumb.width : 110;
                height = _.has(sizeConfig, 'swatchThumb') ? sizeConfig.swatchThumb.height : 90;
                label = this.label ? $('<i></i>').text(this.label).html() : '';
                attr =
                    // ' id="' + controlId + '-item-' + id + '"' +
                    ' index="' + index + '"' +
                    ' aria-checked="false"' +
                    ' tabindex="0"' +
                    ' data-option-type="' + type + '"' +
                    ' data-option-id="' + id + '"' +
                    ' data-option-label="' + label + '"' +
                    ' aria-label="' + label + '"' +
                    ' role="option"' +
                    ' data-thumb-width="' + width + '"' +
                    ' data-thumb-height="' + height + '"';

                if ($widget.options.enableControlLabel) {
                    attr += ' aria-describedby="' + controlId + '"';
                }

                attr += thumb !== '' ? ' data-option-tooltip-thumb="' + thumb + '"' : '';
                attr += value !== '' ? ' data-option-tooltip-value="' + value + '"' : '';

                swatchImageWidth = _.has(sizeConfig, 'swatchImage') ? sizeConfig.swatchImage.width : 30;
                swatchImageHeight = _.has(sizeConfig, 'swatchImage') ? sizeConfig.swatchImage.height : 20;

                if (!this.hasOwnProperty('products') || this.products.length <= 0) {
                    attr += ' data-option-empty="true"';
                }

                if (type === 0) {
                    // Text
                    html += '<div class="' + optionClass + ' text" ' + attr + '>' + (value ? value : label) +
                        '</div>';
                } else if (type === 1) {
                    // Color
                    html += '<div class="' + optionClass + ' color" ' + attr +
                        ' style="background: ' + value +
                        ' no-repeat center; background-size: initial;">' + '' +
                        '</div>';
                } else if (type === 2) {
                    // Image
                    html += '<div class="' + optionClass + ' image" ' + attr +
                        ' style="background: url(' + value + ') no-repeat center; background-size: initial;width:' +
                        swatchImageWidth + 'px; height:' + swatchImageHeight + 'px">' + '' +
                        '</div>';
                } else if (type === 3) {
                    // Clear
                    html += '<div class="' + optionClass + '" ' + attr + '></div>';
                } else {
                    // Default
                    html += '<div class="' + optionClass + '" ' + attr + '>' + label + '</div>';
                }
            });

            return html;
        },

        /**
         * Render select by part of config
         *
         * @param {Object} config
         * @param {String} chooseText
         * @returns {String}
         * @private
         */
        _RenderSwatchSelect: function (config, chooseText) {
            var html;

            if (this.options.jsonSwatchConfig.hasOwnProperty(config.id)) {
                return '';
            }

            html =
                '<select class="' + this.options.classes.selectClass + ' ' + config.code + '">' +
                '<option value="0" data-option-id="0">' + chooseText + '</option>';

            $.each(config.options, function () {
                var label = this.label,
                    attr = ' value="' + this.id + '" data-option-id="' + this.id + '"';

                if (!this.hasOwnProperty('products') || this.products.length <= 0) {
                    attr += ' data-option-empty="true"';
                }

                html += '<option ' + attr + '>' + label + '</option>';
            });

            html += '</select>';

            return html;
        },

        /**
         * Input for submit form.
         * This control shouldn't have "type=hidden", "display: none" for validation work :(
         *
         * @param {Object} config
         * @private
         */
        _RenderFormInput: function (config) {
            return '<input class="' + this.options.classes.attributeInput + ' super-attribute-select" ' +
                'name="super_attribute[' + config.id + ']" ' +
                'type="text" ' +
                'value="" ' +
                'title="' + config.label + '" ' +
                'data-selector="super_attribute[' + config.id + ']" ' +
                'data-validate="{required: true}" ' +
                'aria-required="true" ' +
                'aria-invalid="false">';
        },

        /**
         * Event listener
         *
         * @private
         */
        _EventListener: function () {
            var $widget = this,
                options = this.options.classes,
                target;

            $widget.element.on('a11y:focus', '.' + options.optionClass, function () {
                if (!$(this).hasClass('selected')) {
                    $(this).click();
                }
            });

            $widget.element.on('click', '.' + options.optionClass, function () {
                return $widget._OnClick($(this), $widget);
            });

            $widget.element.on('change', '.' + options.selectClass, function () {
                return $widget._OnChange($(this), $widget);
            });

            $widget.element.on('click', '.' + options.moreButton, function (e) {
                e.preventDefault();

                return $widget._OnMoreClick($(this));
            });

            $widget.element.on('keydown', function (e) {
                if (e.key === 'Enter') {
                    target = $(e.target);

                    if (target.is('.' + options.optionClass)) {
                        return $widget._OnClick(target, $widget);
                    } else if (target.is('.' + options.selectClass)) {
                        return $widget._OnChange(target, $widget);
                    } else if (target.is('.' + options.moreButton)) {
                        e.preventDefault();

                        return $widget._OnMoreClick(target);
                    }
                }
            });
        },

        _loadMedia: function () {
            var $main = this.inProductList ?
                    this.element.parents('.product-item-info') :
                    this.element.parents('.column.main'),
                images;

            if (this.options.useAjax) {
                this._debouncedLoadProductMedia();
            }  else {
                images = this.options.jsonConfig.images[this.getProduct()];

                if (!images) {
                    images = this.options.mediaGalleryInitial;
                }
                this.updateBaseImage(this._sortImages(images), $main, !this.inProductList);
            }
        },

        _sortImages: function (images) {
            return _.sortBy(images, function (image) {
                return parseInt(image.position, 10);
            });
        },

        /**
         * Event for swatch options
         *
         * @param {Object} $this
         * @param {Object} $widget
         * @private
         */
        _OnClick: function ($this, $widget) {
            var $parent = $this.parents('.' + $widget.options.classes.attributeClass),
                $wrapper = $this.parents('.' + $widget.options.classes.attributeOptionsWrapper),
                $label = $parent.find('.' + $widget.options.classes.attributeSelectedOptionLabelClass),
                attributeId = $parent.data('attribute-id'),
                $input = $parent.find('.' + $widget.options.classes.attributeInput),
                checkAdditionalData = JSON.parse(this.options.jsonSwatchConfig[attributeId]['additional_data']),
                $priceBox = $widget._getProductWrapper().find(this.options.selectorProductPrice);

            if ($widget.inProductList) {
                $input = $widget.productForm.find(
                    '.' + $widget.options.classes.attributeInput + '[name="super_attribute[' + attributeId + ']"]'
                );
            }

            if ($this.hasClass('disabled')) {
                return;
            }

            if ($this.hasClass('selected')) {
                $parent.removeAttr('data-option-selected').find('.selected').removeClass('selected');
                $input.val('');
                $label.text('');
                $this.attr('aria-checked', false);
            } else {
                $parent.attr('data-option-selected', $this.data('option-id')).find('.selected').removeClass('selected');
                $label.text($this.data('option-label'));
                $input.val($this.data('option-id'));
                $input.attr('data-attr-name', this._getAttributeCodeById(attributeId));
                $this.addClass('selected');
                $widget._toggleCheckedAttributes($this, $wrapper);
            }

            $widget._Rebuild();

            if ($priceBox.priceBox('instance')) {
                $widget._UpdatePrice();
            } else {
                $priceBox.on('price-box-initialized', () => {
                    $widget._UpdatePrice();
                });
            }

            $(document).trigger('updateMsrpPriceBlock',
                [
                    this._getSelectedOptionPriceIndex(),
                    $widget.options.jsonConfig.optionPrices,
                    $priceBox
                ]);

            if (parseInt(checkAdditionalData['update_product_preview_image'], 10) === 1) {
                $widget._loadMedia();
            }

            $input.trigger('change');
        },

        /**
         * Get selected option price index
         *
         * @return {String|undefined}
         */
        _getSelectedOptionPriceIndex: function () {
            var allowedProduct = this._getAllowedProductWithMinPrice(this._CalcProducts());

            if (_.isEmpty(allowedProduct)) {
                return undefined;
            }

            return allowedProduct;
        },

        /**
         * Get human readable attribute code (eg. size, color) by it ID from configuration
         *
         * @param {Number} attributeId
         * @returns {*}
         */
        _getAttributeCodeById: function (attributeId) {
            var attribute = this.options.jsonConfig.mappedAttributes[attributeId];

            return attribute ? attribute.code : attributeId;
        },

        /**
         * Toggle accessibility attributes
         *
         * @param {Object} $this
         * @param {Object} $wrapper
         */
        _toggleCheckedAttributes: function ($this, $wrapper) {
            $wrapper.attr('aria-activedescendant', $this.attr('id'))
                .find('.' + this.options.classes.optionClass).attr('aria-checked', false);
            $this.attr('aria-checked', true);
        },

        /**
         * Event for select
         *
         * @param {Object} $this
         * @param {Object} $widget
         */
        _OnChange: function ($this, $widget) {
            var $parent = $this.parents('.' + $widget.options.classes.attributeClass),
                attributeId = $parent.data('attribute-id'),
                $input = $parent.find('.' + $widget.options.classes.attributeInput);

            if ($widget.productForm.length > 0) {
                $input = $widget.productForm.find(
                    '.' + $widget.options.classes.attributeInput + '[name="super_attribute[' + attributeId + ']"]'
                );
            }

            if ($this.val() > 0) {
                $parent.attr('data-option-selected', $this.val());
                $input.val($this.val());
            } else {
                $parent.removeAttr('data-option-selected');
                $input.val('');
            }

            $widget._Rebuild();
            $widget._UpdatePrice();
            $widget._loadMedia();
            $input.trigger('change');
        },

        /**
         * Event for more switcher
         *
         * @param {Object} $this
         */
        _OnMoreClick: function ($this) {
            $this.nextAll().show();
            $this.blur().remove();
        },

        /**
         * Rewind options for controls
         */
        _Rewind: function (controls) {
            controls.find('div[data-option-id], option[data-option-id]')
                .removeClass('disabled')
                .removeAttr('disabled');
            controls.find('div[data-option-empty], option[data-option-empty]')
                .attr('disabled', true)
                .addClass('disabled')
                .attr('tabindex', '-1');
            this.disableSwatchForOutOfStockProducts();
        },

        _Rebuild: function () {
            var $widget = this,
                controls = $widget.element.find('.' + $widget.options.classes.attributeClass + '[data-attribute-id]'),
                selected = controls.filter('[data-option-selected]');

            // Enable all options
            $widget._Rewind(controls);

            // done if nothing selected
            if (selected.length <= 0) {
                return;
            }

            // Disable not available options
            controls.each(function () {
                var $this = $(this),
                    id = $this.data('attribute-id'),
                    products = $widget._CalcProducts(id);

                if (selected.length === 1 && selected.first().data('attribute-id') === id) {
                    return;
                }

                $this.find('[data-option-id]').each(function () {
                    var $element = $(this),
                        option = $element.data('option-id');

                    if (!$widget.optionsMap.hasOwnProperty(id) || !$widget.optionsMap[id].hasOwnProperty(option) ||
                        $element.hasClass('selected') ||
                        $element.is(':selected')) {
                        return;
                    }

                    if (_.intersection(products, $widget.optionsMap[id][option].products).length <= 0) {
                        $element.attr('disabled', true).addClass('disabled');
                    }
                });
            });
        },

        /**
         * Get selected product list
         *
         * @returns {Array}
         */
        _CalcProducts: function ($skipAttributeId) {
            var $widget = this,
                selectedOptions = '.' + $widget.options.classes.attributeClass + '[data-option-selected]',
                products = [];

            // Generate intersection of products
            $widget.element.find(selectedOptions).each(function () {
                var id = $(this).data('attribute-id'),
                    option = $(this).attr('data-option-selected');

                if ($skipAttributeId !== undefined && $skipAttributeId === id) {
                    return;
                }

                if (!$widget.optionsMap.hasOwnProperty(id) || !$widget.optionsMap[id].hasOwnProperty(option)) {
                    return;
                }

                if (products.length === 0) {
                    products = $widget.optionsMap[id][option].products;
                } else {
                    products = _.intersection(products, $widget.optionsMap[id][option].products);
                }
            });

            return products;
        },

        _UpdatePrice: function () {
            var $widget = this,
                $product = $widget._getProductWrapper(),
                $productPrice = $product.find(this.options.selectorProductPrice),
                result = $widget._getNewPrices(),
                tierPriceHtml,
                isShow;

            $productPrice.trigger(
                'updatePrice',
                {
                    'prices': $widget._getPrices(result, $productPrice.priceBox('option').prices)
                }
            );

            isShow = typeof result != 'undefined' && result.oldPrice.amount !== result.finalPrice.amount;

            $productPrice.find('span').first().toggleClass('special-price', isShow);

            $product.find(this.options.slyOldPriceSelector)[isShow ? 'show' : 'hide']();

            if (typeof result != 'undefined' && result.tierPrices && result.tierPrices.length) {
                if (this.options.tierPriceTemplate) {
                    tierPriceHtml = mageTemplate(
                        this.options.tierPriceTemplate,
                        {
                            'tierPrices': result.tierPrices,
                            '$t': $t,
                            'currencyFormat': this.options.jsonConfig.currencyFormat,
                            'priceUtils': priceUtils
                        }
                    );
                    $(this.options.tierPriceBlockSelector).html(tierPriceHtml).show();
                }
            } else {
                $(this.options.tierPriceBlockSelector).hide();
            }

            $product.find(this.options.normalPriceLabelSelector).hide();

            _.each(this.element.find('.' + this.options.classes.attributeOptionsWrapper), function (attribute) {
                if ($(attribute).find('.' + this.options.classes.optionClass + '.selected').length === 0) {
                    if ($(attribute).find('.' + this.options.classes.selectClass).length > 0) {
                        _.each($(attribute).find('.' + this.options.classes.selectClass), function (dropdown) {
                            if ($(dropdown).val() === '0') {
                                $product.find(this.options.normalPriceLabelSelector).show();
                            }
                        }.bind(this));
                    } else {
                        $product.find(this.options.normalPriceLabelSelector).show();
                    }
                }
            }.bind(this));
        },

        _getProductWrapper: function () {
            var selector = this.options.selectorProduct.replace('.product-item-details', '.product-item-info'),
                wrapper = this.element.closest(selector);

            if (!wrapper.length) {
                wrapper = this.element.closest('.column.main').find(selector);
            }

            return wrapper;
        },

        /**
         * Get new prices for selected options
         *
         * @returns {*}
         */
        _getNewPrices: function () {
            var $widget = this,
                newPrices = $widget.options.jsonConfig.prices,
                allowedProduct = this._getAllowedProductWithMinPrice(this._CalcProducts());

            if (!_.isEmpty(allowedProduct)) {
                newPrices = this.options.jsonConfig.optionPrices[allowedProduct];
            }

            return newPrices;
        },

        /**
         * @param {Object} newPrices
         * @param {Object} displayPrices
         * @returns {*}
         */
        _getPrices: function (newPrices, displayPrices) {
            var $widget = this;

            if (_.isEmpty(newPrices)) {
                newPrices = $widget._getNewPrices();
            }
            _.each(displayPrices, function (price, code) {

                if (newPrices[code]) {
                    displayPrices[code].amount = newPrices[code].amount - displayPrices[code].amount;
                }
            });

            return displayPrices;
        },

        /**
         * Get product with minimum price from selected options.
         *
         * @param {Array} allowedProducts
         * @returns {String}
         */
        _getAllowedProductWithMinPrice: function (allowedProducts) {
            var optionPrices = this.options.jsonConfig.optionPrices,
                product = {},
                optionFinalPrice, optionMinPrice;

            _.each(allowedProducts, function (allowedProduct) {
                optionFinalPrice = parseFloat(optionPrices[allowedProduct].finalPrice.amount);

                if (_.isEmpty(product) || optionFinalPrice < optionMinPrice) {
                    optionMinPrice = optionFinalPrice;
                    product = allowedProduct;
                }
            }, this);

            return product;
        },

        /**
         * Gets all product media and change current to the needed one
         */
        _LoadProductMedia: function () {
            var $widget = this,
                $this = $widget.element,
                productData = this._determineProductData(),
                mediaCallData,
                mediaCacheKey,

                /**
                 * Processes product media data
                 *
                 * @param {Object} data
                 * @returns void
                 */
                mediaSuccessCallback = function (data) {
                    if (!(mediaCacheKey in $widget.options.mediaCache)) {
                        $widget.options.mediaCache[mediaCacheKey] = data;
                    }
                    $widget._ProductMediaCallback($this, data, productData.isInProductView);
                };

            if (!$widget.options.mediaCallback) {
                return;
            }

            mediaCallData = {
                'product_id': this.getProduct()
            };

            mediaCacheKey = JSON.stringify(mediaCallData);

            if (mediaCacheKey in $widget.options.mediaCache) {
                $widget._EnableProductMediaLoader($this);
                mediaSuccessCallback($widget.options.mediaCache[mediaCacheKey]);
            } else {
                mediaCallData.isAjax = true;
                $widget._EnableProductMediaLoader($this);
                $widget.xhr = $.request.get({
                    url: $widget.options.mediaCallback,
                    data: mediaCallData
                }).then(function (response) {
                    mediaSuccessCallback(response.body);
                });
            }
        },

        /**
         * Enable loader
         *
         * @param {Object} element
         */
        _EnableProductMediaLoader: function (element) {
            element.parents('.product-item-info')
                .addClass('product-item-info-image-loading')
                .find('.product-image-photo')
                .addClass(this.options.classes.loader);
        },

        /**
         * Disable loader
         *
         * @param {Object} element
         */
        _DisableProductMediaLoader: function (element) {
            element.parents('.product-item-info')
                .removeClass('product-item-info-image-loading')
                .find('.product-image-photo')
                .removeClass(this.options.classes.loader);
        },

        /**
         * Callback for product media
         *
         * @param {Object} $this
         * @param {String} response
         * @param {Boolean} isInProductView
         */
        _ProductMediaCallback: function ($this, response, isInProductView) {
            var $main = isInProductView ? $this.parents('.column.main') : $this.parents('.product-item-info'),
                $widget = this,
                images = [],

                /**
                 * Check whether object supported or not
                 *
                 * @param {Object} e
                 * @returns {*|Boolean}
                 */
                support = function (e) {
                    return e.hasOwnProperty('large') && e.hasOwnProperty('medium') && e.hasOwnProperty('small');
                };

            if (_.size($widget) < 1 || !support(response)) {
                this.updateBaseImage(this.options.mediaGalleryInitial, $main, isInProductView);

                return;
            }

            images.push({
                full: response.large,
                img: response.medium,
                thumb: response.small,
                srcset: response.srcset,
                isMain: true
            });

            if (response.hasOwnProperty('gallery')) {
                $.each(response.gallery, function () {
                    if (!support(this) || response.large === this.large) {
                        return;
                    }
                    images.push({
                        full: this.large,
                        img: this.medium,
                        thumb: this.small,
                        srcset: this.srcset
                    });
                });
            }

            this.updateBaseImage(images, $main, isInProductView);
        },

        /**
         * Check if images to update are initial and set their type
         * @param {Array} images
         */
        _setImageType: function (images) {

            images.map(function (img) {
                if (!img.type) {
                    img.type = 'image';
                }
            });

            return images;
        },

        /**
         * Update [gallery-placeholder] or [product-image-photo]
         * @param {Array} images
         * @param {jQuery} context
         * @param {Boolean} isInProductView
         */
        updateBaseImage: function (images, context, isInProductView) {
            var self = this,
                justAnImage = images[0],
                initialImages = this.options.mediaGalleryInitial,
                imagesToUpdate,
                galleryEl = context.find(this.options.mediaGallerySelector),
                gallery,
                photo = context.find('.product-image-photo'),
                isInitial;

            if (galleryEl.gallery) {
                gallery = galleryEl.gallery('instance');
            }

            if (isInProductView) {
                if (!gallery) {
                    galleryEl.on('gallery:loaded', function () {
                        this.updateBaseImage(images, context, isInProductView);
                    }.bind(this));

                    return;
                }

                imagesToUpdate = images.length ? this._setImageType($.extend(true, [], images)) : [];
                isInitial = _.isEqual(
                    imagesToUpdate.map(({thumb, img, full, type, videoUrl}) => ({thumb, img, full, type, videoUrl})),
                    initialImages.map(({thumb, img, full, type, videoUrl}) => ({thumb, img, full, type, videoUrl}))
                );

                if (this.options.gallerySwitchStrategy === 'prepend' && !isInitial) {
                    imagesToUpdate = imagesToUpdate.concat(initialImages);
                }

                imagesToUpdate = this._setImageIndex(imagesToUpdate);

                gallery.updateData(imagesToUpdate);
            } else if (justAnImage && justAnImage.img) {
                photo.on('load', function () {
                    setTimeout(function () {
                        self._DisableProductMediaLoader(self.element);
                    }, 100);
                });

                photo.attr('src', justAnImage.img);

                if (justAnImage.srcset && justAnImage.srcset.medium) {
                    photo.attr('srcset', justAnImage.srcset.medium);

                    // eslint-disable-next-line max-depth
                    if (!photo.attr('sizes')) {
                        photo.attr('sizes', photo.attr('data-sizes'));
                    }
                } else {
                    photo.attr('data-sizes', photo.attr('sizes'));
                    photo.removeAttr('sizes');
                }
            }
        },

        _setImageIndex: function (images) {
            var length = images.length,
                i;

            for (i = 0; length > i; i++) {
                images[i].i = i + 1;
            }

            return images;
        },

        /**
         * Emulate mouse click on all swatches that should be selected
         * @param {Object} [selectedAttributes]
         */
        _EmulateSelected: function (selectedAttributes) {
            $.each(selectedAttributes, function (attributeCode, optionId) {
                var elem = this.element.find('.' + this.options.classes.attributeClass +
                    '[data-attribute-code="' + attributeCode + '"] [data-option-id="' + optionId + '"]'),
                    parentInput = elem.parent();

                if (elem.hasClass('selected')) {
                    return;
                }

                if (parentInput.hasClass(this.options.classes.selectClass)) {
                    parentInput.val(optionId);
                    parentInput.trigger('change');
                } else {
                    elem.trigger('click');
                }
            }.bind(this));
        },

        /**
         * Emulate mouse click or selection change on all swatches that should be selected
         * @param {Object} [selectedAttributes]
         */
        _EmulateSelectedByAttributeId: function (selectedAttributes) {
            $.each(selectedAttributes, function (attributeId, optionId) {
                var elem = this.element.find('.' + this.options.classes.attributeClass +
                    '[data-attribute-id="' + attributeId + '"] [data-option-id="' + optionId + '"]'),
                    parentInput = elem.parent();

                if (elem.hasClass('selected')) {
                    return;
                }

                if (parentInput.hasClass(this.options.classes.selectClass)) {
                    parentInput.val(optionId);
                    parentInput.trigger('change');
                } else {
                    elem.trigger('click');
                }
            }.bind(this));
        },

        /**
         * Get default options values settings with either URL query parameters
         */
        _getSelectedAttributes: function () {
            var hashIndex = window.location.href.indexOf('#'),
                selectedAttributes = {},
                params;

            if (hashIndex !== -1) {
                params = $.parseQuery(window.location.href.substr(hashIndex + 1));

                selectedAttributes = _.invert(_.mapObject(_.invert(params), function (attributeId) {
                    return this.option('jsonConfig.mappedAttributes.' + attributeId, {}).code || attributeId;
                }.bind(this)));
            }

            return selectedAttributes;
        },

        /**
         * Callback which fired after gallery gets initialized.
         *
         * @param {HTMLElement} element - DOM element associated with a gallery.
         */
        _onGalleryLoaded: function (element) {
            this.options.mediaGalleryInitial = element.gallery('instance').returnCurrentImages();
        },

        /**
         * Sets mediaCache for cases when jsonConfig contains preSelectedGallery on layered navigation result pages
         */
        _setPreSelectedGallery: function () {
            var mediaCallData;

            if (this.options.jsonConfig.preSelectedGallery) {
                mediaCallData = {
                    'product_id': this.getProduct()
                };

                this.options.mediaCache[JSON.stringify(mediaCallData)] = this.options.jsonConfig.preSelectedGallery;
            }
        },

        _onQtyChanged: function () {
            var $price = this.element.parents(this.options.selectorProduct)
                .find(this.options.selectorProductPrice);

            $price.trigger(
                'updatePrice',
                {
                    'prices': this._getPrices(this._getNewPrices(), $price.priceBox('option').prices)
                }
            );
        }
    });

    $('body').on('catalogCategoryAddToCartRedirect', function (event, data) {
        $(data.form).find('[name*="super"]').each(function (index, item) {
            var $item = $(item),
                attr;

            if ($item.attr('data-attr-name')) {
                attr = $item.attr('data-attr-name');
            } else {
                attr = $item.parent().attr('attribute-code');
            }
            data.redirectParameters.push(attr + '=' + $item.val());
        });
    });
});
