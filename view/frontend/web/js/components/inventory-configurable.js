define([
    'jquery',
    'configurableVariationQty'
], function ($, configurableVariationQty) {
    'use strict';

    $.mixin('configurable', {
        _configureElement: function (o, element) {
            var salesChannel = this.options.spConfig.channel,
                salesChannelCode = this.options.spConfig.salesChannelCode,
                productVariationsSku = this.options.spConfig.sku;

            o(element);

            configurableVariationQty(productVariationsSku[this.simpleProduct], salesChannel, salesChannelCode);
        }
    });
});
