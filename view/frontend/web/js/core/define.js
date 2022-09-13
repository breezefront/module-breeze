(function () {
    /**
     * @param {Array} deps
     * @param {Function} callback
     */
    window.define = function (deps, callback) {
        var args = [],
            mapping = {
                'jquery': $,
                'ko': ko,
                'mage/cookies': $.cookies,
                'mage/translate': $.__,
                'Magento_Customer/js/customer-data': $.sections,
                'Magento_Ui/js/lib/view/utils/async': $,
                'underscore': _
            };

        if (!_.isArray(deps)) {
            return;
        }

        deps.forEach(function (alias) {
            // @todo: text!, functions, urls
            args.push(mapping[alias] || undefined);
        });

        callback.apply(this, args);
    };
})();
