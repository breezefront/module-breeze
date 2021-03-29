/* global breeze */
(function () {
    'use strict';

    breeze.widget('accordion', function (settings) {
        $(this).tabs($.extend({
            collapsible: true
        }, settings));
    });

    $(document).on('breeze:mount:accordion', function (event) {
        $(event.detail.el).accordion(event.detail.settings);
    });
})();
