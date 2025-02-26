/* global jarallax jarallaxVideo */
(function () {
    'use strict';

    $(document).on('breeze:load', () => {
        jarallaxVideo();

        $('[data-background-type="video"]').each((i, el) => {
            var $el = $(el).addClass('jarallax'),
                parallaxSpeed = $el.data('enableParallax') ? parseFloat($el.data('parallaxSpeed')) : 1;

            jarallax(el, {
                onCoverImage: () => $(el).addClass('jarallax-ready'),
                imgSrc: $el.data('videoFallbackSrc'),
                speed: !isNaN(parallaxSpeed) ? parallaxSpeed : 0.5,
                videoLoop: $el.data('videoLoop'),
                videoPlayOnlyVisible: $el.data('videoPlayOnlyVisible'),
                videoLazyLoading: $el.data('videoLazyLoad'),
                elementInViewport: $el.data('elementInViewport') &&
                    $el[0].querySelector($el.data('elementInViewport'))
            });
        });
    });
})();
