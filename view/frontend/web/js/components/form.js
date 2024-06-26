(function () {
    'use strict';

    $.view('form', {
        component: 'Magento_Ui/js/form/form',
        defaults: {
            namespace: false
        },

        _initialize: function (name, options, element) {
            this.source = $.registry.get(options.provider);

            this._super(name, options, element);

            this.selector = 'input, select, textarea, [data-form-part=' + this.namespace + ']';
        },

        save: function () {
            var provider = $.registry.get(this.options.provider);

            if (!this.validate()) {
                return;
            }

            $(this.element).find(this.selector).each(function () {
                provider.set(this.name, $(this).val());
            });

            return provider.save();
        },

        /**
         * @return {Boolean}
         */
        validate: function () {
            var validator = this.element.find('form').validator('instance');

            return !validator || validator.isValid();
        }
    });
})();
