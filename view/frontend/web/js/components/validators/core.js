(function () {
    'use strict';

    $.validator.validators = _.extend($.validator.validators, {
        required: [
            function (value) {
                return !(value === '' || value == null || value.length === 0 || /^\s+$/.test(value));
            },
            $t('This is a required field.')
        ],
        email: [
            function (value) {
                return $('<input type="email" required/>').val(value).get(0).checkValidity();
            },
            $t('Please enter a valid email address (Ex: johndoe@domain.com).')
        ],
        equalTo: [
            function (value, element, settings) {
                return value === $(settings).val();
            },
            $t('Please enter the same value again.')
        ],
        min: [
            function (value, el, min) {
                return value >= min;
            },
            function (value, el, min) {
                return $t('Please enter a value greater than or equal to {0}.').replace('{0}', min);
            }
        ],
        max: [
            function (value, el, max) {
                return value <= max;
            },
            function (value, el, max) {
                return $t('Please enter a value less than or equal to {0}.').replace('{0}', max);
            }
        ],
        minlength: [
            function (value, el, min) {
                return value >= min;
            },
            function (value, el, min) {
                return $t('Please enter at least {0} characters.').replace('{0}', min);
            }
        ],
        maxlength: [
            function (value, el, max) {
                return value <= max;
            },
            function (value, el, max) {
                return $t('Please enter no more than {0} characters.').replace('{0}', max);
            }
        ],
        'required-entry': 'required',
        'validate-email': 'email',
        'validate-select': [
            function (value) {
                return value !== 'none' && value != null && value.length !== 0;
            },
            $t('Please select an option.')
        ],
        'validate-not-negative-number': [
            function (value) {
                return value === '' || parseFloat(value) > 0;
            },
            $t('Please enter a number 0 or greater in this field.')
        ]
    });
})();
