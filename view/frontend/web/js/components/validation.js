(function () {
    'use strict';

    $.widget('validator', {
        component: 'validation',

        create: function () {
            var self = this;

            this.validator = $.validator(this.element, this.options);

            // do not use event delegation because this callback should be first
            if (!this.element.attr('data-validator')) {
                this.element.attr('data-validator', true).on('submit', function () {
                    if (!self.validator.isValid()) {
                        return false;
                    }
                });
            }
        },

        destroy: function () {
            this.element.removeAttr('data-validator');
            this._super();
        },

        isValid: function (inputs, silent) {
            return this.validator.isValid(inputs, silent);
        },

        validate: function (inputs, silent) {
            return this.validator.validate(inputs, silent);
        },

        reset: function () {
            return this.validator.reset();
        },

        clearError: function (...args) {
            var elements = null;

            if (args) {
                elements = args.map(arg => $(arg));
            }

            return this.validator.reset(elements);
        }
    });

    $.fn.validation = $.fn.validator;

    $.fn.valid = function (inputs, silent) {
        $(this).validator();

        return $(this).validator('instance').isValid(inputs, silent);
    };

    $(document).on('breeze:mount:Magento_Customer/js/block-submit-on-send', function (event, data) {
        $('#' + data.settings.formId).validator(data.settings);
    });

    $(document).on('breeze:load', function () {
        $('form').attr('novalidate', true).on('submit', function () {
            if ($(this).attr('data-validator')) {
                return;
            }

            $(this).validator();

            if (!$(this).validator('instance').isValid()) {
                return false;
            }
        });
    });
})();
