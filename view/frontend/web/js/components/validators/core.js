(function () {
    'use strict';

    // eslint-disable-next-line max-len
    $.validator.regex.email = /^([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*@([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*\.(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]){2,})$/i;

    $.validator.validators = _.extend($.validator.validators, {
        required: [
            (value) => !$.validator.utils.isEmpty(value),
            $t('This is a required field.')
        ],
        email: [
            // eslint-disable-next-line max-len
            (value) => $('<input type="email" required>').val(value).get(0).checkValidity() && $.validator.regex.email.test(value),
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
        pattern: [
            // eslint-disable-next-line max-len
            (value, el, settings) => $.validator.utils.isEmpty(value) || new RegExp(settings.pattern || settings).test(value),
            (value, el, settings) => settings.message || $t('Invalid format.')
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
        ],
        'validate-one-required-by-name': [
            function (value, el, selector) {
                var name = el.name.replace(/([\\"])/g, '\\$1');

                selector = selector === true ? 'input[name="' + name + '"]:checked' : selector;

                return !!this.form.find(selector).length;
            },
            $t('Please select one of the options.')
        ],
    });

    // Validate Date
    (function () {
        $.validator.validators['validate-date'] = [
            (value, el, settings) => $.date(value, settings.dateFormat).isValid(),
            (value, el, settings) => {
                var format = $.date.normalizeFormat(settings.dateFormat);

                return $t('The valid format is {0}. For example, the valid date for "May 4, 2001" is {1}')
                    .replace('{0}', format)
                    .replace('{1}', $.date('May 4, 2001').format(format));
            }
        ];

        $.validator.validators['validate-dob'] = [
            (value, el, settings) => {
                var date = $.date(value, settings.dateFormat);

                if (!date.isValid()) {
                    return false;
                }

                return date < $.date();
            },
            $t('The Date of Birth should not be greater than today.')
        ];
    })();
})();
