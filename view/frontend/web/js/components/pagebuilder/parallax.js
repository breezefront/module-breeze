/* global jarallax */
(function () {
    'use strict';

    $('[data-enable-parallax="1"]').not('[data-background-type="video"]').each((i, el) => {
        var $el = $(el),
            parallaxSpeed = parseFloat($el.data('parallaxSpeed')),
            elementStyle = window.getComputedStyle(el);

        jarallax(el, {
            imgPosition: elementStyle.backgroundPosition || '50% 50%',
            imgRepeat: elementStyle.backgroundRepeat || 'no-repeat',
            imgSize: elementStyle.backgroundSize || 'cover',
            speed: !isNaN(parallaxSpeed) ? parallaxSpeed : 0.5
        });
    });
})();
