(function () {
    'use strict';

    $.widget('mage.formKey', {
        options: {
            inputSelector: 'input[name="form_key"]'
        },

        _create: function () {
            $(this.options.inputSelector).val($.breeze.getFormKey());
        }
    });

    $(document).on('breeze:load contentUpdated', function () {
        $('input[name="form_key"]').val($.breeze.getFormKey());
    });
})();
