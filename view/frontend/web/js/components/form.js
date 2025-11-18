(function () {
    'use strict';

    $.view('form', {
        component: 'Magento_Ui/js/form/form',
        defaults: {
            namespace: false
        },

        _initialize: function (name, options, element) {
            this._super(name, options, element);
            this.selector = 'input, select, textarea, [data-form-part=' + this.namespace + ']';
        },

        initObservable: function () {
            return this._super().observe(['responseData', 'responseStatus']);
        },

        save: function (redirect, data) {
            this.validate();

            if (this.source.get('params.invalid')) {
                return;
            }

            $(this.el).find(this.selector).each((i, el) => {
                this.source.set(`data.${el.name}`, $(el).val());
            });

            return this.setAdditionalData(data).submit();
        },

        setAdditionalData: function (data) {
            $.each(data || {}, (key, value) => {
                this.source.set(`data.${key}`, value);
            });
            return this;
        },

        submit: function () {
            return this.source.save({
                response: {
                    data: this.responseData,
                    status: this.responseStatus
                },
            });
        },

        validate: function () {
            var validator = this.el.find('form').validator('instance'),
                isValid = !validator || validator.isValid();

            this.source.set('params.invalid', !isValid);

            return isValid;
        }
    });
})();
