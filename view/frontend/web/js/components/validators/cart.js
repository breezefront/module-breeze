/* global $t */
(function () {
    'use strict';

    window.breeze.validator.validators['validate-item-quantity'] = [
        function (value, element, settings) {
            var result = false,
                qty = parseFloat(value),
                isMinAllowedValid = typeof settings.minAllowed === 'undefined' ||
                    qty >= parseFloat(settings.minAllowed),
                isMaxAllowedValid = typeof settings.maxAllowed === 'undefined' ||
                    qty <= parseFloat(settings.maxAllowed),
                isQtyIncrementsValid = typeof settings.qtyIncrements === 'undefined' ||
                    qty % parseFloat(settings.qtyIncrements) === 0;

            result = qty > 0;

            if (result === false) {
                this.itemQtyErrorMessage = $t('Please enter a quantity greater than 0.');//eslint-disable-line max-len

                return result;
            }

            result = isMinAllowedValid;

            if (result === false) {
                this.itemQtyErrorMessage = $t('The fewest you may purchase is %1.').replace('%1', settings.minAllowed);//eslint-disable-line max-len

                return result;
            }

            result = isMaxAllowedValid;

            if (result === false) {
                this.itemQtyErrorMessage = $t('The maximum you may purchase is %1.').replace('%1', settings.maxAllowed);//eslint-disable-line max-len

                return result;
            }

            result = isQtyIncrementsValid;

            if (result === false) {
                this.itemQtyErrorMessage = $t('You can buy this product only in quantities of %1 at a time.').replace('%1', settings.qtyIncrements);//eslint-disable-line max-len

                return result;
            }

            return result;
        },
        function () {
            return this.itemQtyErrorMessage;
        }
    ];
})();
