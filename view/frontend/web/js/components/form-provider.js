(function () {
    'use strict';

    var FormProvider = $.breezemap.uiElement.extend({
        save: function (params) {
            $('body').trigger('processStart');
            return $.request.post({
                url: this.options.submit_url,
                type: 'form',
                data: this.get('data'),
                complete: function (response) {
                    $('body').trigger('processStop');
                    params?.response?.data(response.body);
                    params?.response?.status(response.status);
                }
            });
        }
    });

    $(document).on('breeze:mount:Magento_Ui/js/form/provider', function (event, data) {
        $.registry.set(data.settings.__scope, new FormProvider(data.settings));
    });
})();
