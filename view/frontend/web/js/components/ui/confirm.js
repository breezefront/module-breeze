/* global _ */
(function () {
    'use strict';

    $.widget('confirm', 'modal', {
        component: 'Magento_Ui/js/modal/confirm',
        options: {
            modalClass: 'confirm',
            title: '',
            focus: '.action-accept',
            actions: {

                /** Callback always - called on all actions. */
                always: function () {},

                /** Callback confirm. */
                confirm: function () {},

                /** Callback cancel. */
                cancel: function () {}
            },
            buttons: [{
                text: $.__('Cancel'),
                class: 'action-secondary action-dismiss',

                /** Click handler. */
                click: function (event) {
                    this.closeModal(event);
                }
            }, {
                text: $.__('OK'),
                class: 'action-primary action-accept',

                /** Click handler. */
                click: function (event) {
                    this.closeModal(event, true);
                }
            }]
        },

        /** Create widget. */
        _create: function () {
            this._super();
            this.openModal();
            this.modal.find(this.options.modalCloseBtn).off().on('click', _.bind(this.closeModal, this));
            this.element.on('confirm:closed', _.bind(this._remove, this));
        },

        /** Remove modal window. */
        _remove: function () {
            this.modal.remove();
        },

        /** Close modal window. */
        closeModal: function (event, result) {
            result = result || false;

            if (result) {
                this.options.actions.confirm(event);
            } else {
                this.options.actions.cancel(event);
            }

            this.options.actions.always(event);

            return this._super();
        }
    });

    /**
     * @param {Object} config
     * @return {Cash}
     */
    $.confirm = function (config) {
        return $('<div></div>').html(config.content).confirm(config);
    };
})();
