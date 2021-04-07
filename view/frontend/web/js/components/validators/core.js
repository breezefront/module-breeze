/* global breeze $t _ */
(function () {
    'use strict';

    breeze.validator.validators = _.extend(breeze.validator.validators, {
        required: [
            function (value) {
                return !(value === '' || value == null || value.length === 0 || /^\s+$/.test(value));
            },
            $t('This is a required field.')
        ],
        email: [
            function (value) {
                return /^([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*@([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*\.(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]){2,})$/i.test(value);
            },
            $t('Please enter a valid email address (Ex: johndoe@domain.com).')
        ],
        equalTo: [
            function (value, element, settings) {
                return value === $(settings).val();
            },
            $t('Please enter the same value again.')
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
