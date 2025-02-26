(function () {
    'use strict';

    $(document).on('breeze:mount:Magento_Customer/js/logout-redirect', function (event, data) {
        setTimeout(() => {
            window.location.href = data.settings.url;
        }, 5000);
    });
})();
