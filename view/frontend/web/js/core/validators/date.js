define([
    'jquery',
    'Swissup_Breeze/js/core/date'
], function ($, $date) {
    'use strict';

    $.validator.validators['validate-date'] = [
        (value, el, settings) => $.validator.utils.isEmpty(value) || $date(value, settings.dateFormat).isValid(),
        (value, el, settings) => {
            var format = $date.normalizeFormat(settings.dateFormat);

            return $t('The valid format is {0}. For example, the valid date for "May 4, 2001" is {1}')
                .replace('{0}', format)
                .replace('{1}', $date('May 4, 2001').format(format));
        }
    ];

    $.validator.validators['validate-dob'] = [
        (value, el, settings) => {
            if ($.validator.utils.isEmpty(value)) {
                return true;
            }

            var date = $date(value, settings.dateFormat);

            if (!date.isValid()) {
                return false;
            }

            return date < $date();
        },
        $t('The Date of Birth should not be greater than today.')
    ];
});
