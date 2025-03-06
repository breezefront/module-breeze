(function () {
    'use strict';

    /** Contructor */
    var Validator = function (form, options) {
        this.form = form;
        this.elementErrors = new WeakMap();
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

        form: function (elements, silent) {
            return this.isValid(elements, silent);
        },

        /**
         * Silent validation
         * @return {Boolean}
         */
        checkForm: function () {
            return this.isValid(true);
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
            this.reset(elements);
        },

        resetElements: function (elements) {
            this.reset(elements);
        },

        hideErrors: function (elements) {
            this.reset(elements);
        },

        showErrors: function (elements) {
            this.validate(elements);
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
                var node = $(self.options.errorTextTag),
                    id = element.id || element.name;

                node.text(this)
                    .attr('for', id)
                    .attr('id', id + '-error')
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

            this.elementErrors.set(element, errorNodes);

            anchor.attr('aria-invalid', true)
                .attr('aria-describedby', errorNodes.first().attr('id'));

            if (this.options.errorPlacement) {
                errorNodes.each((i, el) => this.options.errorPlacement($(el), anchor));
                return;
            }

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
            if (this.elementErrors.has(element)) {
                this.elementErrors.get(element).remove();
                this.elementErrors.delete(element);
            }

            $(element)
                .removeAttr('aria-invalid aria-describedby')
                .parent()
                .find('.error-text[generated]')
                .remove();
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
    $.validator.addMethod = (id, fn, message) => {
        $.validator.validators[id] = [fn, message];
    };

    $.breezemap['Magento_Ui/js/lib/validation/utils'] = $.validator.utils;

    function validate(id, value, params, additionalParams) {
        var rule, message, valid,
            result = {
                rule: id,
                passed: true,
                message: ''
            };

        if (_.isObject(params)) {
            message = params.message || '';
        }

        if (!$.validator.validators[id]) {
            return result;
        }

        rule = $.validator.validators[id];
        while (typeof rule === 'string') {
            rule = $.validator.validators[rule];
        }

        valid = rule[0](value, params, additionalParams);
        message = message || rule[1];

        if (!valid) {
            params = Array.isArray(params) ? params : [params];

            if (typeof message === 'function') {
                message = message();
            }

            message = params.reduce(function (msg, param, idx) {
                return msg.replace(new RegExp('\\{' + idx + '\\}', 'g'), param);
            }, message);

            result.passed = false;
            result.message = message;
        }

        return result;
    }

    $.breezemap['Magento_Ui/js/lib/validation/validator'] = function (rules, value, additionalParams) {
        var result = {
            passed: true,
        };

        _.every(rules, function (params, id) {
            if (params.validate || params !== false || additionalParams) {
                result = validate(id, value, params, additionalParams);
                return result.passed;
            }
            return true;
        });

        return result;
    };
})();
