(function () {
    'use strict';

    $(document).on('breeze:load', function () {
        $('.panel.header > .header.links')
            .clone()
            .data('breeze-temporary', true)
            .appendTo(document.getElementById('store.links'));

        // see Model/Filter/Dom/LazyLoadBackground.php
        $.async('.breeze-bg-lazy', el => {
            $.onReveal(el, () => {
                $(el).css('background-image', '');
            }, {
                rootMargin: '100px',
            });
        });
    });
})();
