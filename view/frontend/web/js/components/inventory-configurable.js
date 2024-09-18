define([
    'jquery',
    'configurableVariationQty'
], function ($, configurableVariationQty) {
    'use strict';

    $.mixinSuper('configurable', {
        _configureElement: function (element) {
            var salesChannel = this.options.spConfig.channel,
                salesChannelCode = this.options.spConfig.salesChannelCode,
                productVariationsSku = this.options.spConfig.sku;

            this._super(element);

            configurableVariationQty(productVariationsSku[this.simpleProduct], salesChannel, salesChannelCode);
        }
    });
});
