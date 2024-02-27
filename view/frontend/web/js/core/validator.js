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

        valid: function (elements, silent) {
            return this.isValid(elements, silent);
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

            if (result.valid && this.options.onValid) {
                this.options.onValid.call(this, result);
            } else if (!result.valid && this.options.onInvalid) {
                this.options.onInvalid.call(this, result);
            }

            if (!result.valid) {
                $(this.form).trigger('invalid-form', this);
            }

            $(this.form).trigger('validateAfter', {
                result: result
            });

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
                self._overridable('removeErrorNodes', [this]);
            });
        },

        resetForm: function (elements) {
            return this.reset(elements);
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
         * @return {String}
         */
        _getElementValue: function (element) {
            var type = $(element).attr('type'),
                value = $(element).val(),
                elements;

            if (type === 'radio' || type === 'checkbox') {
                elements = $('input[name="' + $(element).attr('name') + '"]:checked');
                value = elements.val();

                // checkbox without a value
                if (elements.length && !value) {
                    return '*';
                }

                return value;
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
                validators = $.validator.validators,
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

                    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/url#pattern_validation
                    if (attr === 'pattern' && $(element).attr('title')) {
                        data[attr] = {
                            pattern: value,
                            message: $(element).attr('title')
                        };
                    }
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
            this._overridable('addErrorNodes', [element, this.createErrorNodes(element, errors)]);
        },

        /**
         * @param {String} methodName
         * @param {Array} args
         */
        _overridable: function (methodName, args) {
            if (this.options[methodName]) {
                this.options[methodName].apply(this, args);
            } else {
                this[methodName].apply(this, args);
            }
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

            if (anchor.data('errors-message-box')) {
                return $(anchor.data('errors-message-box')).empty().append(errorNodes);
            }

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

    /** [validation description] */
    $.validator = function (element, options) {
        return new Validator(element, options);
    };
    $.validator.validateElement = $.validator.validateSingleElement = (element) => {
        return ($(element).parents('form').data('validator') || $.validator(element)).isValid(element);
    };
    $.validator.regex = {};
    $.validator.validators = {};
    $.validator.utils = {
        isEmpty: function (value) {
            return value === '' || value == null || value.length === 0 || /^\s+$/.test(value);
        },

        isEmptyNoTrim: function (value) {
            return value === '' || value == null || value.length === 0;
        }
    };

    $.breezemap['Magento_Ui/js/lib/validation/utils'] = $.validator.utils;
})();
