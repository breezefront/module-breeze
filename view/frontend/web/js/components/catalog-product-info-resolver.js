define([
    'underscore'
], function (_) {
    'use strict';

    return function ($form) {
        var info = [],
            product = _.findWhere($form.serializeArray(), {
                name: 'product'
            });

        if (!_.isUndefined(product)) {
            info.push({
                id: product.value
            });
        }

        return _.uniq(info, function (item) {
            return item.id;
        });
    };
});
