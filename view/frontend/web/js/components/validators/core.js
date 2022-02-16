/* global _ */
(function () {
    'use strict';

    $.validator.validators = _.extend($.validator.validators, {
        required: [
            function (value) {
                return !(value === '' || value == null || value.length === 0 || /^\s+$/.test(value));
            },
            $.__('This is a required field.')
        ],
        email: [
            function (value) {
                return $('<input type="email" required/>').val(value).get(0).checkValidity();
            },
            $.__('Please enter a valid email address (Ex: johndoe@domain.com).')
        ],
        equalTo: [
            function (value, element, settings) {
                return value === $(settings).val();
            },
            $.__('Please enter the same value again.')
        ],
        'required-entry': 'required',
        'validate-email': 'email',
        'validate-select': [
            function (value) {
                return value !== 'none' && value != null && value.length !== 0;
            },
            $.__('Please select an option.')
        ],
        'validate-not-negative-number': [
            function (value) {
                return value === '' || parseFloat(value) > 0;
            },
            $.__('Please enter a number 0 or greater in this field.')
        ]
    });
})();
