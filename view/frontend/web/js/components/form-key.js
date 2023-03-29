(function () {
    'use strict';

    $.widget('formKey', {
        options: {
            inputSelector: 'input[name="form_key"]'
        },

        /** Fill input with valid form key */
        _create: function () {
            $(this.options.inputSelector).val($.cookies.get('form_key'));
        }
    });

    /**
     * Generate form key string
     */
    function generateFormKeyString() {
        var result = '',
            length = 16,
            chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

        while (length--) {
            result += chars[Math.round(Math.random() * (chars.length - 1))];
        }

        return result;
    }

    /**
     * Init form_key inputs with value
     */
    function initFormKey() {
        var formKey = $.cookies.get('form_key');

        if (!formKey) {
            formKey = generateFormKeyString();
            $.cookies.set('form_key', formKey, {
                expires: 1
            });
        }

        $('input[name="form_key"]').val(formKey);
    }

    // $(document).on('breeze:mount:Magento_PageCache/js/form-key-provider', function () {
    //     initFormKey();
    // });

    $(document).on('breeze:load contentUpdated', function () {
        initFormKey();
    });
})();
