define([
    'jquery',
    'mage/template'
], function ($, mageTemplate) {
    'use strict';

    $.widget('mage.dataPost', {
        component: 'mage/dataPost',
        options: {
            formTemplate: '<form action="<%- data.action %>" method="post">' +
            '<% _.each(data.data, function(value, index) { %>' +
            '<input name="<%- index %>" value="<%- value %>">' +
            '<% }) %></form>',
            postTrigger: ['[data-post]', '[data-post-remove]'],
            formKeyInputSelector: 'input[name="form_key"]'
        },

        _create: function () {
            this._bind();
        },

        _bind: function () {
            var events = {};

            $.each(this.options.postTrigger, function (index, value) {
                events['click ' + value] = '_postDataAction';
            });

            this._on(events);
        },

        _postDataAction: function (e) {
            var params = $(e.currentTarget).data('post') || $(e.currentTarget).data('post-remove');

            e.preventDefault();
            this.postData(params);
        },

        postData: function (params) {
            var formKey = $(this.options.formKeyInputSelector).val(),
                $form, input;

            if (formKey) {
                params.data.form_key = formKey;
            }

            $form = $(mageTemplate(this.options.formTemplate, {
                data: params
            }));

            if (params.files) {
                $form[0].enctype = 'multipart/form-data';
                $.each(params.files, function (key, files) {
                    if (files instanceof FileList) {
                        input = document.createElement('input');
                        input.type = 'file';
                        input.name = key;
                        input.files = files;
                        $form[0].appendChild(input);
                    }
                });
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

    $(document).dataPost();
});
