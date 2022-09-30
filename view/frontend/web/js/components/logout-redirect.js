(function () {
    'use strict';

    $(document).on('breeze:mount:Magento_Customer/js/logout-redirect', function (event, data) {
        var id = setTimeout(() => {
            window.location.href = data.settings.url;
        }, 5000);

        $(document).one('turbolinks:visit', () => {
            clearTimeout(id);
        });
    });
})();
