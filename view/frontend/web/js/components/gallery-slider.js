define([
    'jquery'
], async function ($) {
    'use strict';

    var galleryEl = $('.breeze-gallery.slider'),
        gallery = await galleryEl.find('.stage').componentAsync('gallery'),
        slideChanged = false;

    function createSlider() {
        $('.thumbnails', galleryEl).pagebuilderSlider('destroy');
        if ($('.thumbnails img', galleryEl).length) {
            $('.thumbnails', galleryEl).pagebuilderSlider({
                skippable: false,
                tabbable: false
            });
        }

        $('.images a', galleryEl).attr('tabindex', -1);
        $('.images', galleryEl).pagebuilderSlider('destroy').pagebuilderSlider({
            infinite: gallery.options.loop,
            skippable: false
        });
    }

    createSlider();

    $('.images', galleryEl)
        .on('keydown', e => {
            if (e.key === 'Enter') {
                gallery.open();
            }
        })
        .on('pagebuilderSlider:ready', (e, data) => {
            var timer,
                magnifierEl = $(gallery.imagesWrapper.find('.item').add(gallery.element));

            if (!gallery.options.magnifierOpts.enabled) {
                return;
            }

            data.instance.slider.on('scroll', () => {
                magnifierEl.magnifier('status', false);
                gallery.options.magnifierOpts.enabled = false;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    magnifierEl.magnifier('status', true);
                    gallery.options.magnifierOpts.enabled = true;
                }, 100);
            });
        })
        .on('pagebuilderSlider:slideChange', (e, data) => {
            slideChanged = true;
            $.sleep(10).then(() => { slideChanged = false; });
            gallery.activate(data.instance.slide);
        });

    galleryEl
        .on('gallery:afterActivate', (e, data) => {
            if (!slideChanged && !data.instance.opened()) {
                data.instance.imagesWrapper.data('pagebuilderSlider').scrollToPage(
                    data.instance.activeIndex
                );
            }
            $('.thumbnails', galleryEl).data('pagebuilderSlider')?.scrollToSlide(
                data.instance.activeIndex
            );
        })
        .on('gallery:afterClose', (e, data) => {
            data.instance.imagesWrapper.data('pagebuilderSlider').scrollToPage(
                data.instance.activeIndex,
                true
            );
            $('.thumbnails', galleryEl).data('pagebuilderSlider')?.scrollToSlide(
                data.instance.activeIndex,
                true
            );
        })
        .on('gallery:afterUpdateData', createSlider);
});
