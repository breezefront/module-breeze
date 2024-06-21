(function () {
    'use strict';

    $.view('customer', {
        component: 'Magento_Customer/js/view/customer',
        customer: $.customerData.get('customer')
    });
})();
