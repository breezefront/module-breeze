/* global jarallax */
(function () {
    'use strict';

    $(document).on('breeze:load', () => {
        $('[data-enable-parallax="1"]').not('[data-background-type="video"]').each((i, el) => {
            var $el = $(el).addClass('jarallax'),
                parallaxSpeed = parseFloat($el.data('parallaxSpeed')),
                elementStyle = window.getComputedStyle(el);

            jarallax(el, {
                onCoverImage: () => $(el).addClass('jarallax-ready'),
                imgPosition: elementStyle.backgroundPosition || '50% 50%',
                imgRepeat: elementStyle.backgroundRepeat || 'no-repeat',
                imgSize: elementStyle.backgroundSize || 'cover',
                speed: !isNaN(parallaxSpeed) ? parallaxSpeed : 0.5
            });
        });
    });
})();
