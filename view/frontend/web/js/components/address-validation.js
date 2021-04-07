/* global breeze $t _ */
(function () {
    'use strict';

    var postCodeValidator = {
        validatedPostCodeExample: [],

        /**
         * @param {*} postCode
         * @param {*} countryId
         * @param {Array} postCodesPatterns
         * @return {Boolean}
         */
        validate: function (postCode, countryId, postCodesPatterns) {
            var self = this,
                result,
                patterns = postCodesPatterns ? postCodesPatterns[countryId] :
                    window.checkoutConfig.postCodes[countryId];

            this.validatedPostCodeExample = [];

            if (!postCode || !patterns) {
                return true;
            }

            result = _.find(patterns, function (item) {
                var regex = new RegExp(item.pattern);

                self.validatedPostCodeExample.push(item.example);

                return regex.test(postCode);
            });

            return result !== undefined;
        }
    };

    breeze.widget('addressValidation', {
        options: {
            selectors: {
                button: '[data-action=save-address]',
                zip: '#zip',
                country: 'select[name="country_id"]'
            }
        },

        /** [create description] */
        create: function () {
            this.zipInput = this.element.find(this.options.selectors.zip);
            this.countrySelect = this.element.find(this.options.selectors.country);
            this._addPostCodeValidation();
        },

        /**
         * Add postcode validation
         */
        _addPostCodeValidation: function () {
            var self = this;

            this.zipInput.on('keyup', _.debounce(function (event) {
                    var valid = self._validatePostCode(event.target.value);

                    self._renderValidationResult(valid);
                }, 500)
            );

            this.countrySelect.on('change', function () {
                var valid = self._validatePostCode(self.zipInput.val());

                self._renderValidationResult(valid);
            });
        },

        /**
         * Validate post code value.
         *
         * @protected
         * @param {String} postCode - post code
         * @return {Boolean} Whether is post code valid
         */
        _validatePostCode: function (postCode) {
            var countryId = this.countrySelect.val();

            if (postCode === null) {
                return true;
            }

            return postCodeValidator.validate(postCode, countryId, this.options.postCodes);
        },

        /**
         * Renders warning messages for invalid post code.
         *
         * @protected
         * @param {Boolean} valid
         */
        _renderValidationResult: function (valid) {
            var warnMessage,
                alertDiv = this.zipInput.next();

            if (!valid) {
                warnMessage = $t('Provided Zip/Postal Code seems to be invalid.');

                if (postCodeValidator.validatedPostCodeExample.length) {
                    warnMessage += $t(' Example: ') + postCodeValidator.validatedPostCodeExample.join('; ') + '. ';
                }
                warnMessage += $t('If you believe it is the right one you can ignore this notice.');
            }

            alertDiv.children().first().text(warnMessage);

            if (valid) {
                alertDiv.hide();
            } else {
                alertDiv.show();
            }
        }
    });

    $(document).on('breeze:mount:addressValidation', function (event, data) {
        $(data.el).addressValidation(data.settings);
    });
})();
