(function () {
    'use strict';

    $(document).on('breeze:load', () => { setTimeout(() => {
        $('.sidebar-main').a11y('skippable', {
            id: 'product-list',
            label: $t('Skip to product list'),
            destination: '.column.main',
        });

        // remove duplicated tabstops (banner with button, )
        // $('a[href]:has(button)').attr('tabindex', -1); // 3x slower then the selector below
        $('a[href] button').parents('a').attr('tabindex', -1);

        $('.panel.header > .header.links')
            .clone()
            .appendTo(document.getElementById('store.links'));

        // see Model/Filter/Dom/LazyLoadBackground.php
        $.async('.breeze-bg-lazy', el => {
            $.onReveal(el, () => {
                var className = el.className.match(/background-image-[a-z0-9]+/);

                $(el).css('background-image', '');

                if (className) {
                    $(`.${className[0]}`).css('background-image', '');
                }
            }, {
                rootMargin: '100px',
            });
        });
    })});

    // Remove tabindex from filter title, when it's not clickable
    function updateShopByTabindex() {
        $('.block.filter .filter-title').attr(
            'tabindex',
            $('.block.filter .filter-content').css('visibility') === 'hidden' ? 0 : -1
        );
    }

    $(document)
        .one('keydown', () => $('html').addClass('kbd'))
        .on('breeze:resize', _.debounce(updateShopByTabindex, 500))
        .on('collapsible:afterCreate', (e, data) => {
            if (data.instance.trigger.is('.block.filter .filter-title')) {
                updateShopByTabindex();
            }
        });
})();
