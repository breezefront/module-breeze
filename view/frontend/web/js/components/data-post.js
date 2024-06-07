(function () {
    'use strict';

    $.widget('dataPost', {
        options: {
            formTemplate: '<form action="<%- data.action %>" method="post">' +
            '<% _.each(data.data, function(value, index) { %>' +
            '<input name="<%- index %>" value="<%- value %>">' +
            '<% }) %></form>',
            formKeyInputSelector: 'input[name="form_key"]'
        },

        postData: function (params) {
            var formKey = $(this.options.formKeyInputSelector).val(),
                $form;

            if (formKey) {
                params.data.form_key = formKey;
            }

            $form = $(_.template(this.options.formTemplate)({
                data: params
            }));

            if (params.files) {
                console.error('Send files is not implemented');
            }

            $form.appendTo('body').hide();
            $form.target = params.target;

            if (!params.data.confirmation) {
                return this.submitForm($form);
            }

            require(['Magento_Ui/js/modal/confirm'], confirm => {
                confirm({
                    content: params.data.confirmationMessage,
                    actions: {
                        confirm: () => this.submitForm($form)
                    }
                });
            });
        },

        submitForm: function (form) {
            form.submit();
        }
    });

    $.mage = $.mage || {};
    $.mage.dataPost = $.fn.dataPost;

    $(document).on('click.dataPost', '[data-post], [data-post-remove]', function () {
        var params = $(this).data('post') || $(this).data('post-remove') || {};

        params.target = $(this);

        $.fn.dataPost().postData(params);

        return false;
    });
})();
