/* global breeze */
(function () {
    'use strict';

    document.addEventListener('breeze:mount:Magento_Customer/js/customer-data', function (event) {
        fetch(event.detail.settings.sectionLoadUrl)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                $.each(data, breeze.sectionData.set.bind(breeze.sectionData));
            });
    });
})();
