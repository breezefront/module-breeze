/* global _ */
(function () {
    'use strict';

    $.widget('alert', 'confirm', {
        component: 'Magento_Ui/js/modal/alert',
        options: {
            modalClass: 'alert',
            title: $.__('Attention'),
            actions: {

                /** Callback always - called on all actions. */
                always: function () {}
            },
            buttons: [{
                text: $.__('OK'),
                class: 'action-primary action-accept',

                /** Click handler. */
                click: function () {
                    this.closeModal(true);
                }
            }]
        },

        /** Create widget. */
        _create: function () {
            this._super();
            this.element.on('alert:closed', _.bind(this._remove, this));
        }
    });

    /**
     * @param {Object} config
     * @return {Cash}
     */
    $.alert = function (config) {
        return $('<div></div>').html(config.content).alert(config);
    };
})();
