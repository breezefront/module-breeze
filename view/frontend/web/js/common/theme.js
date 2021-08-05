(function () {
    'use strict';

    $(document).on('breeze:load', function () {
        $('.panel.header > .header.links')
            .clone()
            .data('breeze-temporary', true)
            .appendTo(document.getElementById('store.links'));
    });
})();
