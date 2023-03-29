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
            var self = this,
                formKey = $(this.options.formKeyInputSelector).val(),
                $form;

            if (formKey) {
                params.data.form_key = formKey;
            }

            $form = $(_.template(this.options.formTemplate)({
                data: params
            }));

            if (params.files) {
                console.error('Send files is not implemented');
                // $form[0].enctype = 'multipart/form-data';
                // $.each(params.files, function (key, files) {
                //     if (files instanceof FileList) {
                //         input = document.createElement('input');
                //         input.type = 'file';
                //         input.name = key;
                //         input.files = files;
                //         $form[0].appendChild(input);
                //     }
                // });
            }

            $form.appendTo('body').hide();
            $form.target = params.target;

            if (!params.data.confirmation) {
                return this.submitForm($form);
            }

            $.confirm({
                content: params.data.confirmationMessage,
                actions: {
                    confirm: function () {
                        self.submitForm($form);
                    }
                }
            });
        },

        /** [submitForm description] */
        submitForm: function (form) {
            form.submit();
            // $.request.post({
            //     form: form,
            //     strict: false
            // });
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
