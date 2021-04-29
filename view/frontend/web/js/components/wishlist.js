(function () {
    'use strict';

    $.view('wishlist', {
        wishlist: $.sections.get('wishlist')
    });

    $(document).on('breeze:mount:Magento_Wishlist/js/view/wishlist', function (event, data) {
        $(data.el).wishlist(data.settings);
    });
})();
