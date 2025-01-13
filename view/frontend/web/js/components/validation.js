define(['Magento_Ui/js/lib/validation/validator'], function () {
    'use strict';

    $.widget('validator', {
        component: 'validation',

        create: function () {
            var self = this;

            this.validator = $.validator(this.element, this.options);

            // do not use event delegation because this callback should be first
            if (!this.element.attr('data-validator-ready')) {
                this.element.attr('data-validator-ready', true).on('submit', function () {
                    if (!self.validator.isValid()) {
                        return false;
                    }
                });
            }

            [
                'isValid',
                'valid',
                'validate',
                'checkForm',
                'showErrors',
                'hideErrors',
                'reset',
                'resetElements'
            ].forEach(method => {
                this[method] = (...args) => {
                    return this.validator[method](...args);
                };
            });
        },

        destroy: function () {
            this.element.removeAttr('data-validator-ready');
            this._super();
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

    $.fn.validate = function () {
        var validator = $(this).validator('instance');

        if (!validator) {
            $(this).validator();
            validator = $(this).validator('instance');
        }

        return validator;
    };

    $(document).on('breeze:mount:Magento_Customer/js/block-submit-on-send', function (event, data) {
        $('#' + data.settings.formId).validator(data.settings);
    });

    $(document).on('breeze:load', function () {
        $('form').attr('novalidate', true).on('submit', function () {
            if ($(this).attr('data-validator-ready')) {
                return;
            }

            $(this).validator();

            if (!$(this).validator('instance').isValid()) {
                return false;
            }
        });
    });
});
