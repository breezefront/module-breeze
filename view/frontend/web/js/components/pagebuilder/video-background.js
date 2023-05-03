/* global jarallax jarallaxVideo */
(function () {
    'use strict';

    jarallaxVideo();

    $('[data-background-type="video"]').each((i, el) => {
        var $el = $(el),
            parallaxSpeed = $el.data('enableParallax') ? parseFloat($el.data('parallaxSpeed')) : 1;

        jarallax(el, {
            imgSrc: $el.data('videoFallbackSrc'),
            speed: !isNaN(parallaxSpeed) ? parallaxSpeed : 0.5,
            videoLoop: $el.data('videoLoop'),
            videoPlayOnlyVisible: $el.data('videoPlayOnlyVisible'),
            videoLazyLoading: $el.data('videoLazyLoad'),
            elementInViewport: $el.data('elementInViewport') &&
                $el[0].querySelector($el.data('elementInViewport'))
        });
    });
})();
