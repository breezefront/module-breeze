(function () {
    'use strict';

    $.validator.validators = _.extend($.validator.validators, {
        required: [
            (value) => !(value === '' || value == null || value.length === 0 || /^\s+$/.test(value)),
            $t('This is a required field.')
        ],
        email: [
            (value) => $('<input type="email" required>').val(value).get(0).checkValidity(),
            $t('Please enter a valid email address (Ex: johndoe@domain.com).')
        ],
        equalTo: [
            (value, element, settings) => value === $(settings).val(),
            $t('Please enter the same value again.')
        ],
        min: [
            (value, el, min) => value >= +min,
            (value, el, min) => $t('Please enter a value greater than or equal to {0}.').replace('{0}', min)
        ],
        max: [
            (value, el, max) => value <= +max,
            (value, el, max) => $t('Please enter a value less than or equal to {0}.').replace('{0}', max)
        ],
        minlength: [
            (value, el, min) => value.length >= +min,
            (value, el, min) => $t('Please enter at least {0} characters.').replace('{0}', min)
        ],
        maxlength: [
            (value, el, max) => value.length <= +max,
            (value, el, max) => $t('Please enter no more than {0} characters.').replace('{0}', max)
        ],
        'required-entry': 'required',
        'validate-email': 'email',
        'validate-select': [
            (value) => value !== 'none' && value != null && value.length !== 0,
            $t('Please select an option.')
        ],
        'validate-not-negative-number': [
            (value) => value === '' || parseFloat(value) > 0,
            $t('Please enter a number 0 or greater in this field.')
        ]
    });
})();
