define([
    'jquery'
], async function ($) {
    'use strict';

    var galleryEl = $('.breeze-gallery'),
        imagesWrapper = $('.images', galleryEl),
        thumbsWrapper = $('.thumbnails', galleryEl),
        gallery = await galleryEl.find('.stage').componentAsync('gallery'),
        slideChanged = false;

    if (!galleryEl.hasClass('slider') && !galleryEl.hasClass('expanded')) {
        return;
    }

    function reinitSlider() {
        thumbsWrapper.pagebuilderSlider('destroy');
        imagesWrapper.pagebuilderSlider('destroy');
        imagesWrapper.find('a').attr('tabindex', 0);

        if (imagesWrapper.find('.slick-list').css('overflow') !== 'auto') {
            return;
        }

        if ($('.thumbnails img', galleryEl).length) {
            thumbsWrapper.pagebuilderSlider({
                skippable: false,
                tabbable: false,
            });
        }

        imagesWrapper.find('a').attr('tabindex', -1);
        imagesWrapper.pagebuilderSlider({
            infinite: gallery.options.loop,
            skippable: false,
        });
    }

    reinitSlider();

    if (galleryEl.hasClass('expanded')) {
        $(document).on('breeze:resize-x.gallery', reinitSlider);
    }

    imagesWrapper
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
                data.instance.imagesWrapper.data('pagebuilderSlider')?.scrollToPage(
                    data.instance.activeIndex
                );
            }
            thumbsWrapper.data('pagebuilderSlider')?.scrollToSlide(
                data.instance.activeIndex
            );
        })
        .on('gallery:afterClose', (e, data) => {
            data.instance.imagesWrapper.data('pagebuilderSlider')?.scrollToPage(
                data.instance.activeIndex,
                true
            );
            thumbsWrapper.data('pagebuilderSlider')?.scrollToSlide(
                data.instance.activeIndex,
                true
            );
        })
        .on('gallery:afterUpdateData', reinitSlider);
});
