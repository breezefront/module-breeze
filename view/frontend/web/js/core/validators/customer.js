define(['Magento_Ui/js/lib/validation/validator'], function () {
    'use strict';

    $.validator.validators['validate-emails'] = [
        function (value) {
            var emails, i;

            if (!value) {
                return true;
            }

            emails = value.split(/[\s\n\,]+/g);

            for (i = 0; i < emails.length; i++) {
                if (!$.validator.regex.email.test(emails[i].trim())) {
                    return false;
                }
            }

            return true;
        },
        $.__('Please enter valid email addresses, separated by commas. For example, johndoe@domain.com, johnsmith@domain.com.') //eslint-disable-line max-len
    ];

    $.validator.validators['password-not-equal-to-user-name'] = [
        function (value, element, params) {
            if (typeof params === 'string') {
                return value.toLowerCase() !== params.toLowerCase();
            }

            return true;
        },
        $.__('The password can\'t be the same as the email address. Create a new password and try again.')
    ];

    $.validator.validators['validate-customer-password'] = [
        function (value, element) {
            var counter = 0,
                passwordMinLength = $(element).data('password-min-length'),
                passwordMinCharacterSets = $(element).data('password-min-character-sets'),
                result = value.length >= passwordMinLength;

            if (result === false) {
                this.passwordErrorMessage = $.__('Minimum length of this field must be equal or greater than %1 symbols. Leading and trailing spaces will be ignored.').replace('%1', passwordMinLength); //eslint-disable-line max-len

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
                this.passwordErrorMessage = $.__('Minimum of different classes of characters in password is %1. Classes of characters: Lower Case, Upper Case, Digits, Special Characters.').replace('%1', passwordMinCharacterSets); //eslint-disable-line max-len
            }

            return result;
        },
        function () {
            return this.passwordErrorMessage;
        }
    ];
});
