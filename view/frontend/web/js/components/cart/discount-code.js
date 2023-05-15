(function () {
    'use strict';

    $.widget('mage.discountCode', {
        component: 'discountCode',
        _create: function () {
            this.couponCode = $(this.options.couponCodeSelector);
            this.removeCoupon = $(this.options.removeCouponSelector);

            $(this.options.applyButton).on('click', function () {
                this.couponCode.attr('data-validate', '{required:true}');
                this.removeCoupon.attr('value', '0');
                $(this.element).submit();
            }.bind(this));

            $(this.options.cancelButton).on('click', function () {
                this.couponCode.removeAttr('data-validate');
                this.removeCoupon.attr('value', '1');
                this.element.submit();
            }.bind(this));
        }
    });
})();
