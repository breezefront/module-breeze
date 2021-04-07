/* global breeze $t */
(function () {
    'use strict';

    breeze.widget('relatedProducts', {
        options: {
            relatedCheckbox: '.related-checkbox', // Class name for a related product's input checkbox.
            relatedProductsCheckFlag: false, // Related products checkboxes are initially unchecked.
            relatedProductsField: '#related-products-field', // Hidden input field that stores related products.
            selectAllMessage: $t('select all'),
            unselectAllMessage: $t('unselect all'),
            selectAllLink: '[data-role="select-all"]',
            elementsSelector: '.item.product'
        },

        /** Initialize plugin */
        create: function () {
            $(this.options.selectAllLink, this.element).on('click', this._selectAllRelated.bind(this));
            $(this.options.relatedCheckbox, this.element).on('click', this._addRelatedToProduct.bind(this));

            if (this.element.data('shuffle')) {
                breeze.shuffleElements(this.element.find(this.options.elementsSelector));
            }

            breeze.revealElements(
                this.element.find(this.options.elementsSelector),
                this.element.data('limit'),
                this.element.data('shuffle-weighted')
            );
        },

        /**
         * @param {Event} event
         */
        _selectAllRelated: function (event) {
            var innerHTML = this.options.relatedProductsCheckFlag ?
                this.options.selectAllMessage : this.options.unselectAllMessage;

            event.preventDefault();

            $(event.target).html(innerHTML);
            $(this.options.relatedCheckbox).prop(
                'checked',
                this.options.relatedProductsCheckFlag = !this.options.relatedProductsCheckFlag
            );
            this._addRelatedToProduct();
        },

        /** Update hidden field value */
        _addRelatedToProduct: function () {
            $(this.options.relatedProductsField).val(
                $(this.options.relatedCheckbox + ':checked').map(function () {
                    return this.value;
                }).get().join(',')
            );
        }
    });

    $(document).on('breeze:mount:relatedProducts', function (event, data) {
        $(data.el).relatedProducts(data.settings);
    });
})();
