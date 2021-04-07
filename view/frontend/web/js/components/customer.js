/* global breeze */
(function () {
    'use strict';

    breeze.view('customer', {
        customer: breeze.sections.get('customer')
    });

    $(document).on('breeze:mount:Magento_Customer/js/view/customer', function (event) {
        $(event.detail.el).customer(event.detail.settings);
    });
})();
