/* global $t */
(function () {
    'use strict';

    window.breeze.validator.validators['validate-customer-password'] = [
        function (value, element) {
            var counter = 0,
                passwordMinLength = $(element).data('password-min-length'),
                passwordMinCharacterSets = $(element).data('password-min-character-sets'),
                result = value.length >= passwordMinLength;

            if (result === false) {
                this.passwordErrorMessage = $t('Minimum length of this field must be equal or greater than %1 symbols. Leading and trailing spaces will be ignored.').replace('%1', passwordMinLength); //eslint-disable-line max-len

                return result;
            }

            if (value.match(/\d+/)) {
                counter++;
            }

            if (value.match(/[a-z]+/)) {
                counter++;
            }

            if (value.match(/[A-Z]+/)) {
                counter++;
            }

            if (value.match(/[^a-zA-Z0-9]+/)) {
                counter++;
            }

            if (counter < passwordMinCharacterSets) {
                result = false;
                this.passwordErrorMessage = $t('Minimum of different classes of characters in password is %1. Classes of characters: Lower Case, Upper Case, Digits, Special Characters.').replace('%1', passwordMinCharacterSets); //eslint-disable-line max-len
            }

            return result;
        },
        function () {
            return this.passwordErrorMessage;
        }
    ];
})();
