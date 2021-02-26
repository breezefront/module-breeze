/* global breeze */
(function () {
    'use strict';

    breeze.view('wishlist', {
        wishlist: breeze.sections.get('wishlist')
    });

    document.addEventListener('breeze:mount:Magento_Wishlist/js/view/wishlist', function (event) {
        $(event.detail.el).wishlist(event.detail.settings);
    });
})();
