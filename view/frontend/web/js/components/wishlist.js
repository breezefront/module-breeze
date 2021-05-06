(function () {
    'use strict';

    $.view('wishlist', {
        component: 'Magento_Wishlist/js/view/wishlist',
        wishlist: $.sections.get('wishlist')
    });
})();
