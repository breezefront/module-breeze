(function () {
    'use strict';

    var mapping = {
        'yyyy': { regex: '(?<year>\\d{4})', dayjs: 'YYYY' },
        'y':    { regex: '(?<year>\\d{4})', dayjs: 'YYYY' },
        'yy':   { regex: '(?<year>\\d{2})', dayjs: 'YY' },

        'MM':   { regex: '(?<month>\\d{2})', dayjs: 'MM' },
        'M':    { regex: '(?<month>\\d{1,2})', dayjs: 'M' },

        'DD':   { regex: '(?<day>\\d{2})', dayjs: 'DD' },
        'dd':   { regex: '(?<day>\\d{2})', dayjs: 'DD' },
        'D':    { regex: '(?<day>\\d{1,2})', dayjs: 'D' },
        'd':    { regex: '(?<day>\\d{1,2})', dayjs: 'D' },
    };

    function parseFormat(format) {
        var separator = format.match(/[./-]/);

        return [separator, format.split(separator)];
    }

    function parseMagentoDate(value, format) {
        var [separator, parts] = parseFormat(format),
            regex = new RegExp('^' + _.map(parts, part => mapping[part].regex).join(separator) + '$'),
            match = value.match(regex),
            date;

        if (!match) {
            return null;
        }

        if (match.groups.year.length === 2) {
            match.groups.year = +match.groups.year + 2000;
        }

        date = new Date(match.groups.year, match.groups.month - 1, match.groups.day);

        if (date.getFullYear() !== +match.groups.year ||
            date.getMonth() !== match.groups.month - 1 ||
            date.getDate() !== +match.groups.day
        ) {
            return null; // return null because dayjs(null) will return invalid date
        }

        return date;
    }

    $.breeze.date = function (value, format) {
        return dayjs(format ? parseMagentoDate(value, format) : value);
    };

    /**
     * Convert magento format to dayjs format
     *
     * @param {String} format
     * @return {String}
     */
    $.breeze.date.normalizeFormat = function (format) {
        var [separator, parts] = parseFormat(format);

        return _.map(parts, part => mapping[part].dayjs).join(separator);
    };

    return $.breeze.date;
})();
