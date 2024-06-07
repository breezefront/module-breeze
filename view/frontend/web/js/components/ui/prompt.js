define(['Magento_Ui/js/modal/modal'], (modal) => {
    'use strict';

    $.widget('mage.prompt', modal, {
        component: 'Magento_Ui/js/modal/prompt',
        options: {
            modalClass: 'prompt',
            promptContentTmpl: $('#promptTpl').html(),
            promptField: '[data-role="promptField"]',
            attributesForm: {},
            attributesField: {},
            value: '',
            validation: false,
            validationRules: [],
            actions: {
                always: function () {},
                confirm: function () {},
                cancel: function () {}
            },
            buttons: [{
                text: $.mage.__('Cancel'),
                class: 'action-secondary action-dismiss',
                click: function () {
                    this.closeModal();
                }
            }, {
                text: $.mage.__('OK'),
                class: 'action-primary action-accept',
                click: function () {
                    this.closeModal(true);
                }
            }]
        },

        _create: function () {
            this.options.focus = this.options.promptField;
            this.options.validation = this.options.validation && this.options.validationRules.length;
            this.options.outerClickHandler = this.options.outerClickHandler || _.bind(this.closeModal, this, false);
            this._super();

            if (this.options.validation) {
                this.setValidationClasses();
            }

            this.openModal();
        },

        getFormTemplate: function () {
            var formTemplate,
                formAttr = '',
                inputAttr = '',
                attributeName;

            for (attributeName in this.options.attributesForm) {
                if (this.options.attributesForm[attributeName]) {
                    formAttr = formAttr + ' ' + attributeName + '="' +
                        this.options.attributesForm[attributeName] + '"';
                }
            }

            for (attributeName in this.options.attributesField) {
                if (this.options.attributesField[attributeName]) {
                    inputAttr = inputAttr + ' ' + attributeName + '="' +
                        this.options.attributesField[attributeName] + '"';
                }
            }

            formTemplate = $(_.template(this.options.promptContentTmpl)({
                data: this.options,
                formAttr: formAttr,
                inputAttr: inputAttr
            }));

            return formTemplate;
        },

        _remove: function () {
            this.modal.remove();
        },

        validate: function () {
            return $.validator.validateSingleElement(this.options.promptField);
        },

        setValidationClasses: function () {
            this.modal.find(this.options.promptField).attr('class', $.proxy(function (i, val) {
                return val + ' ' + this.options.validationRules.join(' ');
            }, this));
        },

        openModal: function () {
            this._super();
            this.modal.find(this.options.modalContent).append(this.getFormTemplate());
            this.modal.find(this.options.promptField).val(this.options.value);
            setTimeout(() => this.modal.find(this.options.focus).focus(), 200);
        },

        closeModal: function (result) {
            var value;

            if (result) {
                if (this.options.validation && !this.validate()) {
                    return false;
                }

                value = this.modal.find(this.options.promptField).val();
                this.options.actions.confirm.call(this, value);
            } else {
                this.options.actions.cancel.call(this, result);
            }

            this.options.actions.always();
            this.element.on('promptclosed', _.bind(this._remove, this));

            return this._super();
        }
    });

    $.prompt = function (config) {
        return $('<div class="prompt-message"></div>').html(config.content).prompt(config);
    };
});
