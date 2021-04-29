/* global breeze _ */
(function () {
    'use strict';

    $.view('recentProducts', {
        options: {
            limit: 5
        },

        /** [create description] */
        create: function () {
            var self = this,
                products = $.storage.ns('product_data_storage');

            this.visible = false;
            this.items = [];

            // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
            _.each(this.getIds(), function (values) {
                var item = products.get(values.product_id);

                if (item) {
                    self.visible = true;
                    self.items.push(item);
                }
            });
            // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
        },

        /** [getIds description] */
        getIds: function () {
            var ids = $.storage.ns(this.options.storage).get(),
                scope = this.options.productCurrentScope,
                prefix = scope + '-' + breeze.getScopeId(scope),
                currentTime = new Date().getTime() / 1000;

            // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
            ids = _.filter(ids, function (values, key) {
                return key.indexOf(prefix) > -1 && currentTime - values.added_at < 1000;
            });
            // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

            return _.sortBy(ids, 'added_at').reverse().slice(0, this.options.limit);
        },

        /** [getImageData description] */
        getImageData: function (item) {
            var self = this,
                image = _.find(item.images || [], function (img) {
                    return img.code === self.options.imageCode;
                });

            if (!image && item.images) {
                image = item.images[0];
            }

            return {
                retina: false,
                width: image.width,
                height: image.height,
                src: image.url,
                alt: image.label
            };
        },

        /** [getPriceHtml description] */
        getPriceHtml: function (item) {
            var msrp = this.getItemValue(item, 'price_info.extension_attributes.msrp.is_applicable');

            if (msrp) {
                return '';
            }

            return this.getItemValue(item, 'price_info.formatted_prices.final_price');
        },

        /** [getItemValue description] */
        getItemValue: function (item, path) {
            return _.get(item, path.split('.'));
        },

        /** [processorUencPlaceholders description] */
        processorUencPlaceholders: function (string) {
            var uenc = btoa(window.location.href).replace('+/=', '-_,');

            return string.replace('%uenc%', uenc).replace(encodeURI('%uenc%'), uenc);
        },

        /** [getAddToCartPostParams description] */
        getAddToCartPostParams: function (item) {
            return this.processorUencPlaceholders(this.getItemValue(item, 'add_to_cart_button.post_data'));
        },

        /** [getAddToWishlistPostParams description] */
        getAddToWishlistPostParams: function (item) {
            return this.processorUencPlaceholders(this.getItemValue(item, 'extension_attributes.wishlist_button.url'));
        },

        /** [getAddToWishlistPostParams description] */
        getAddToComparePostParams: function (item) {
            var raw = this.getItemValue(item, 'add_to_compare_button.url') ||
                      this.getItemValue(item, 'add_to_compare_button.post_data');

            return this.processorUencPlaceholders(raw);
        }
    });

    $(document).on('breeze:mount:Swissup_Breeze/js/components/recent-products', function (event, data) {
        $(data.el).recentProducts(data.settings);
    });
})();
