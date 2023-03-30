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

    // Validate Date
    (function () {
        var mapping = {
            'yyyy': { regex: '(?<year>\\d{4})', example: '2001' },
            'y':    { regex: '(?<year>\\d{4})', example: '2001' },
            'yy':   { regex: '(?<year>\\d{2})', example: '01' },

            'MM':   { regex: '(?<month>\\d{2})', example: '05' },
            'M':    { regex: '(?<month>\\d{1,2})', example: '5' },

            'DD':   { regex: '(?<day>\\d{2})', example: '04' },
            'dd':   { regex: '(?<day>\\d{2})', example: '04' },
            'D':    { regex: '(?<day>\\d{1,2})', example: '4' },
        };

        function parseDateFormat(format) {
            var separator = format.match(/[./-]/);

            return [separator, format.split(separator)];
        }

        function parseDate(value, dateFormat) {
            var [separator, parts] = parseDateFormat(dateFormat),
                regex = new RegExp(_.map(parts, part => mapping[part].regex).join(separator)),
                match = value.match(regex),
                date;

            if (!match) {
                return false;
            }

            date = new Date(match.groups.year, match.groups.month - 1, match.groups.day);

            if (date.getFullYear() !== +match.groups.year ||
                date.getMonth() !== match.groups.month - 1 ||
                date.getDate() !== +match.groups.day
            ) {
                return false;
            }

            return date;
        }

        $.validator.validators['validate-date'] = [
            (value, el, settings) => {
                return !!parseDate(value, settings.dateFormat);
            },
            (value, el, settings) => {
                var [separator, parts] = parseDateFormat(settings.dateFormat),
                    format = _.map(parts, part => mapping[part].regex.match(/<(.*)>/)[1]).join(separator),
                    example = _.map(parts, part => mapping[part].example).join(separator);

                return $t('The valid format is {0}. For example, the valid date for "May 4, 2001" is {1}')
                    .replace('{0}', format)
                    .replace('{1}', example);
            }
        ];

        $.validator.validators['validate-dob'] = [
            (value, el, settings) => {
                var date = parseDate(value, settings.dateFormat);

                if (!date) {
                    return false;
                }

                return date < new Date();
            },
            $t('The Date of Birth should not be greater than today.')
        ];
    })();
})();
