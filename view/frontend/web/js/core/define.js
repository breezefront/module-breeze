(function () {
    'use strict';

    $.breezemap = {
        'jquery': $,
        'ko': ko,
        'mage/cookies': $.cookies,
        'mage/translate': $.__,
        'Magento_Customer/js/customer-data': $.sections,
        'Magento_Ui/js/lib/view/utils/async': $,
        'uiComponent': $.uiComponent,
        'underscore': _,
    };

    function resolve(alias) {
        // @todo: text!, functions, urls
        return $.breezemap[alias] || undefined;
    }

    /**
     * @param {Array} deps
     * @param {Function} callback
     */
    window.define = function (deps, callback) {
        var args = [];

        if (!_.isArray(deps)) {
            return;
        }

        deps.forEach(function (alias) {
            args.push(resolve(alias));
        });

        callback.apply(this, args);
    };

    window.require = (deps, callback) => window.define(deps, callback);
    window.require.toUrl = (path) => window.VIEW_URL + '/' + path;
    window.require.config = _.noop;
})();
