(function () {
    'use strict';

    $(document).on('breeze:load', function () {
        $('.sidebar-main').a11y('skippable', {
            id: 'product-list',
            label: $t('Skip to product list'),
            destination: '.column.main',
        });

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

    // Remove tabindex from filter title, when it's not clickable
    function updateShopByTabindex() {
        $('.block.filter .filter-title').attr(
            'tabindex',
            $('.block.filter .filter-content').css('visibility') === 'hidden' ? 0 : -1
        );
    }

    $(document)
        .on('breeze:resize', _.debounce(updateShopByTabindex, 500))
        .on('collapsible:afterCreate', (e, data) => {
            if (data.instance.trigger.is('.block.filter .filter-title')) {
                updateShopByTabindex();
            }
        });
})();
