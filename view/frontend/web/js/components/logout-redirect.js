(function () {
    'use strict';

    $(document).on('breeze:mount:Magento_Customer/js/logout-redirect', function (event, data) {
        $.sections.reload($.sections.getSectionNames());
        $(document).on('customer-data-reload', function () {
            setTimeout(() => {
                window.location.href = data.settings.url;
            }, 5000);
        });
    });
})();