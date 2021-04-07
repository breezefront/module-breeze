/* global breeze */
(function () {
    'use strict';

    breeze.view('wishlist', {
        wishlist: breeze.sections.get('wishlist')
    });

    $(document).on('breeze:mount:Magento_Wishlist/js/view/wishlist', function (event, data) {
        $(data.el).wishlist(data.settings);
    });
})();
