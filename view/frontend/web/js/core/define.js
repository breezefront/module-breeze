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
        var result;

        if ($.breezemap.hasOwnProperty(alias)) {
            return $.breezemap[alias];
        }

        if (alias.indexOf('text!') === 0) {
            result = alias.substr(5).replace(/[\/.]/g, '_');
            result = $('#' + result).html();
        } else if (alias.includes('//')) {
            result = $.loadScript(alias);
        }

        $.breezemap[alias] = result;

        return $.breezemap[alias];
    }

    /**
     * @param {Array} deps
     * @param {Function} callback
     */
    window.require = function (deps, success, error) {
        var args = [];

        if (!_.isArray(deps)) {
            return;
        }

        deps.forEach((alias) => {
            args.push(resolve(alias));
        });

        Promise.all(args)
            .then((values) => success.apply(this, values))
            .catch((reason) => {
                if (error) {
                    error(reason);
                } else {
                    throw reason;
                }
            });
    };

    window.define = (deps, callback) => window.require(deps, callback);
    window.require.toUrl = (path) => window.VIEW_URL + '/' + path;
    window.require.config = _.noop;
})();
