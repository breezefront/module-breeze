/* global $t */
(function () {
    'use strict';

    window.breeze.validator.validators['validate-emails'] = [
        function (value) {
            var validRegexp, emails, i;

            if (!value) {
                return true;
            }

            validRegexp = /^([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*@([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*\.(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]){2,})$/i; //eslint-disable-line max-len
            emails = value.split(/[\s\n\,]+/g);

            for (i = 0; i < emails.length; i++) {
                if (!validRegexp.test(emails[i].trim())) {
                    return false;
                }
            }

            return true;
        },
        $t('Please enter valid email addresses, separated by commas. For example, johndoe@domain.com, johnsmith@domain.com.')
    ];

    window.breeze.validator.validators['password-not-equal-to-user-name'] = [
        function (value, element, params) {
            if (typeof params === 'string') {
                return value.toLowerCase() !== params.toLowerCase();
            }

            return true;
        },
        $t('The password can\'t be the same as the email address. Create a new password and try again.')
    ];

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
