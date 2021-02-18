/* global breeze _ */
(function () {
    'use strict';

    breeze.widget('dataPost', {
        options: {
            formTemplate: '<form action="<%- data.action %>" method="post">' +
            '<% _.each(data.data, function(value, index) { %>' +
            '<input name="<%- index %>" value="<%- value %>">' +
            '<% }) %></form>',
            postTrigger: ['a[data-post]', 'button[data-post]', 'span[data-post]'],
            formKeyInputSelector: 'input[name="form_key"]'
        },

        /** Send post request */
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

            if (params.data.confirmation) {
                if (confirm(params.data.confirmationMessage)) {
                    $form.appendTo('body').hide().trigger('submit');
                }
            } else {
                $form.appendTo('body').hide().trigger('submit');
            }
        }
    });

    $(document).on('click.dataPost', '[data-post]', function () {
        var params = $(this).data('post');

        $.fn.dataPost().postData(params);

        return false;
    });
})();
