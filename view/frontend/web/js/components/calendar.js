(function () {
    'use strict';

    $.widget('calendar', {
        create: function () {
            this.element.addClass('abs-visually-hidden').attr('tabindex', -1);
            this.calendar = this.element.parent().find('.input-breeze-calendar');

            if (!this.calendar.length) {
                this.calendar = $('<input class="input-breeze-calendar">')
                    .attr('type', this.options.showsTime ? 'datetime-local' : 'date')
                    .insertBefore(this.element);
            }

            this.calendar.attr('value', this.toISOString());

            if (this.options.maxDate) {
                this.calendar.attr('max', this.toISOString(this.calculateDate(this.options.maxDate)));
            }

            if (this.options.minDate) {
                this.calendar.attr('min', this.toISOString(this.calculateDate(this.options.minDate)));
            }

            this.calendar.on('input', () => {
                var value = '',
                    date = $.date(this.calendar.val());

                if (date.isValid()) {
                    value = date.format($.date.normalizeFormat(this.options.dateFormat));
                }

                this.element.val(value);
            });

            this.element.on('input', () => {
                var value = this.toISOString();

                if (value) {
                    this.calendar.val(value);
                }
            });
        },

        /**
         * Date restrictions support: '+1M +10D', '-1d'
         * See https://jqueryui.com/datepicker/#min-max
         */
        calculateDate: function (rules) {
            var result = $.date(),
                mapping = {
                    'D': 'd',
                    'W': 'w',
                    'Y': 'y',
                };

            if (rules instanceof Date) {
                return $.date(rules);
            }

            rules.split(' ').forEach(period => {
                var match = period.match(/(?<period>(-)?\d+)(?<unit>\w)/),
                    unit = match.groups.unit || 'D';

                result = result.add(match.groups.period, mapping[unit] || unit);
            });

            return result;
        },

        toISOString: function (date) {
            date = date || this.getDate();

            if (!date.isValid()) {
                return '';
            }

            return date.format('YYYY-MM-DD');
        },

        getDate: function () {
            var value = this.element.val();

            return value ? $.date(value, this.options.dateFormat) : $.date(null);
        },

        destroy: function () {
            this.calendar.remove();
            this._super();
        }
    });
})();
