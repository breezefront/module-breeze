/* global breeze */
(function () {
    'use strict';

    /**
     * Generate form key string
     * @private
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
     * @private
     */
    function initFormKey() {
        var formKey = breeze.cookies.get('form_key');

        if (!formKey) {
            formKey = generateFormKeyString();
            breeze.cookies.set('form_key', formKey, {
                expires: 1
            });
        }

        $('input[name="form_key"]').val(formKey);
    }

    document.addEventListener('breeze:mount:Magento_PageCache/js/form-key-provider', function () {
        initFormKey();
    });
})();
