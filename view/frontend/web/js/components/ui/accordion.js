/* global breeze */
(function () {
    'use strict';

    breeze.widget('accordion', 'tabs', {
        options: {
            collapsible: true
        }
    });

    $(document).on('breeze:mount:accordion', function (event, data) {
        $(data.el).accordion(data.settings);
    });
})();
