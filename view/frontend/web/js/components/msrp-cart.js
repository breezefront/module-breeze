(function () {
    'use strict';

    function isMsrpApplied(cartItems) {
        return _.find(cartItems, function (item) {
            if (_.has(item, 'canApplyMsrp')) {
                return item.canApplyMsrp;
            }

            return false;
        });
    }

    function updateDisplaySubtotal(cart) {
        $.registry.get('minicart')[0]?.displaySubtotal(!isMsrpApplied(cart.items));
    }

    $(document).one('breeze:mount:Magento_Checkout/js/view/minicart', function () {
        updateDisplaySubtotal($.sections.get('cart')());
        $.sections.get('cart').subscribe(function (cart) {
            updateDisplaySubtotal(cart);
        });
    });
})();
