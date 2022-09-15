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

    var staticUrl = window.require.baseUrl;

    window.require = window.requirejs = function (deps, callback) {
        return window.define(deps, callback);
    };

    window.require.toUrl = function (path) {
        return staticUrl + '/' + path.trim('/');
    };
})();
