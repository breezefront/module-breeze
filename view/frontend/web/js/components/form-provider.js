(function () {
    'use strict';

    var FormProvider = $.Base.extend({
        defaults: {
            data: {}
        },

        set: function (key, value) {
            this.data[key] = value;
        },

        /**
         * @param {String} path
         * @return {Mixed}
         */
        get: function (path) {
            return _.get(this, path.split('.'));
        },

        save: function () {
            return $.request.post({
                url: this.options.submit_url,
                type: 'form',
                data: this.data
            });
        }
    });

    $(document).on('breeze:mount:Magento_Ui/js/form/provider', function (event, data) {
        $.registry.set(data.settings.__scope, new FormProvider(data.settings));
    });
})();
