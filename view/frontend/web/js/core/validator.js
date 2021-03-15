/* global $t */
(function () {
    'use strict';

    /** Contructor */
    var Validator = function (form, options) {
        this.form = form;
        this.options = $.extend({
            errorClass: 'mage-error',
            errorTextTag: '<div>',
            errorTextClass: 'mage-error'
        }, options || {});

        $(form).attr('novalidate', true);
    };

    Validator.prototype = {
        /**
         * @param {Array|Element|null} elements
         * @param {Boolean} silent
         * @return {Boolean}
         */
        isValid: function (elements, silent) {
            return this.validate(elements, silent).valid;
        },

        /**
         * Validate input(s) or whole form and return validation object
         *
         * @param {Array|Element|null} elements
         * @param {Boolean} silent
         * @return {Object}
         */
        validate: function (elements, silent) {
            var self = this,
                result = {
                    valid: true,
                    errors: []
                };

            if (elements === true) {
                silent = true;
                elements = false;
            }

            elements = this._elements(elements);

            this.reset(elements);

            $(elements).each(function () {
                var res = self._validateElement(this);

                if (res.valid) {
                    return;
                }

                result.valid = false;
                result.errors.push(res);

                if (!silent) {
                    self._showErrors(res.field, res.errors);
                }
            });

            if (result.errors.length) {
                result.errors[0].field.focus();
            }

            return result;
        },

        /**
         * @param {Array|Element|null} elements
         */
        reset: function (elements) {
            var self = this;

            elements = this._elements(elements);

            $(elements).each(function () {
                self.removeErrorClass(this);
                self.removeErrorNodes(this);
            });
        },

        /**
         * @param {Element} element
         * @return {Object}
         */
        _validateElement: function (element) {
            var self = this,
                value = this._getElementValue(element),
                result = {
                    valid: true,
                    field: element,
                    errors: []
                };

            this._validators(element).some(function (validator) {
                var message = validator.message;

                if (validator.fn.call(self, value, element, validator.settings)) {
                    return false;
                }

                if (typeof message === 'function') {
                    message = message.call(self, value, element, validator.settings);
                }

                result.valid = false;
                result.errors.push(message);

                return true;
            });

            return result;
        },

        /**
         * @param {Element} element
         * @return {Mixed}
         */
        _getElementValue: function (element) {
            var type = $(element).attr('type'),
                value = $(element).val();

            if (type === 'radio' || type === 'checkbox') {
                return $('input[name="' + $(element).attr('name') + '"]:checked').val();
            }

            if (typeof value === 'string') {
                return value.replace(/\r/g, '');
            }

            return value;
        },

        /**
         * @param {Element} element
         * @return {Array}
         */
        _validators: function (element) {
            var result = [],
                validators = window.breeze.validator.validators,
                native = ['required', 'minlength', 'maxlength', 'min', 'max', 'pattern'],
                data = $(element).data('validate') || {};

            if (typeof data === 'string') {
                try {
                    data = eval('(' + data + ')'); // eslint-disable-line
                } catch (e) {
                    console.error('Cannot read validation rules: ' + data);
                    data = {};
                }
            }

            $.each(native, function (i, attr) {
                var value = $(element).attr(attr);

                if (value !== undefined && !data[attr]) {
                    data[attr] = value;
                }
            });

            element.classList.forEach(function (name) {
                if (!validators[name]) {
                    return;
                }
                data[name] = true;
            });

            $.each(data, function (name, settings) {
                var validator = validators[name];

                while (typeof validator === 'string') {
                    validator = validators[validator];
                }

                if (settings === false || !validator) {
                    return;
                }

                result.push({
                    fn: validator[0],
                    message: validator[1],
                    settings: settings
                });
            });

            return result;
        },

        /**
         * @param {Array|Element|null} elements
         * @return {Array}
         */
        _elements: function (elements) {
            var added = {};

            elements = elements || this.form;
            elements = $(elements);

            if ($(elements[0]).is('form')) {
                elements = $(elements[0])
                    .find('input:not([type=hidden]):not([type=submit]), select, textarea')
                    .not('[disabled]')
                    .filter(function () {
                        if (!this.name ||
                            this.name in added ||
                            $(this).width() <= 0 ||
                            $(this).height() <= 0
                        ) {
                            return false;
                        }

                        added[this.name] = true;

                        return true;
                    });
            }

            return elements;
        },

        /**
         * @param {Element} element
         * @param {Array} errors
         */
        _showErrors: function (element, errors) {
            this.addErrorClass(element);
            this.addErrorNodes(element, this.createErrorNodes(element, errors));
        },

        /**
         * @param {Element} element
         */
        addErrorClass: function (element) {
            $(element).addClass(this.options.errorClass);
        },

        /**
         * @param {Element} element
         */
        removeErrorClass: function (element) {
            $(element).removeClass(this.options.errorClass);
        },

        /**
         * @param {Element} element
         * @param {Array} errors
         * @return {Array}
         */
        createErrorNodes: function (element, errors) {
            var self = this,
                nodes = $([]);

            $.each(errors, function () {
                var node = $(self.options.errorTextTag);

                if (element.id) {
                    node.attr('for', element.id);
                    node.attr('id', element.id + '-error');
                }

                node.text(this)
                    .attr('generated', true)
                    .addClass([
                        'error-text',
                        self.options.errorClass,
                        self.options.errorTextClass
                    ].join(' '));

                nodes = nodes.add(node.get(0));
            });

            return nodes;
        },

        /**
         * @param {Element} element
         * @param {Collection} errorNodes
         */
        addErrorNodes: function (element, errorNodes) {
            var anchor = $(element),
                next = $(element).nextAll().last();

            if (next.length) {
                anchor = next;
            }

            anchor.after(errorNodes);
        },

        /**
         * @param {Element} element
         */
        removeErrorNodes: function (element) {
            $(element).parent().find('.error-text[generated]').remove();
        }
    };

    window.breeze = window.breeze || {};

    /** [validation description] */
    window.breeze.validator = function (element, options) {
        return new Validator(element, options);
    };

    window.breeze.validator.validators = {
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
    };
})();