(cookies => {
    'use strict';

    function generateFormKeyString() {
        var result = '',
            length = 16,
            chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

        while (length--) {
            result += chars[Math.round(Math.random() * (chars.length - 1))];
        }

        return result;
    }

    $.breeze.getFormKey = function () {
        var formKey = cookies.get('form_key');

        if (!formKey) {
            formKey = generateFormKeyString();
            cookies.set('form_key', formKey, {
                expires: 1
            });
        }

        return formKey;
    };
})($.cookies);
