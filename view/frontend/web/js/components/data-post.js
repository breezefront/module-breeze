/* global _ */
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

            $form.appendTo('body').hide();

            if (!params.data.confirmation || confirm(params.data.confirmationMessage)) { // eslint-disable-line
                $form.submit();
                // breeze.request.post({
                //     form: $form,
                //     strict: false
                // });
            }
        }
    });

    $(document).on('click.dataPost', '[data-post], [data-post-remove]', function () {
        var params = $(this).data('post') || $(this).data('post-remove');

        $.fn.dataPost().postData(params);

        return false;
    });
})();
