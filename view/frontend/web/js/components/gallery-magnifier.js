(function () {
    'use strict';

    var isTouch = 'ontouchstart' in window;

    $.widget('magnifier', {
        options: {
            mode: 'auto',           // auto (stage with fallback to lens), stage, lens
            zoom: 'auto',           // auto or number. When using number, consider changing upscale option.
            zoomMin: 1.6,           // min zoom to use, otherwise - disable magnifier.
            zoomMax: 2.5,           // max zoom to use, otherwise - downscale the image.
            upscale: 1.5,           // max upscale to satisfy zoomMin.
            stage: {
                position: 'right',  // left, right, inner
                width: '100w',      // number or percent of width, height
                height: '100h'      // number or percent of width, height
            },
            lens: {
                shape: 'circle',    // rectangle, circle
                width: 180,         // px
                height: 180         // px
            }
        },

        create: function () {
            this.memo = {};
            this.state = { enabled: true };
            this.rtl = $('body').hasClass('rtl');
            this.gallery = this.options.gallery;
            this.image = this.element.find('img');

            if (this.element.parent().hasClass('images')) {
                this.imageIndex = this.element.index();
            }

            this.addEventListeners();
        },

        init: function () {
            if (!['auto', 'stage', 'lens'].includes(this.options.mode)) {
                this.options.mode = 'auto';
            }

            if (this.options.mode === 'lens' && this.options.stage.position === 'inner') {
                this.options.stage.position = 'right';
            }

            if (this.rtl && this.options.stage.position !== 'inner') {
                this.options.stage.position = this.options.stage.position === 'right' ? 'left' : 'right';
            }
        },

        prepareMarkup: function () {
            var container;

            if (this.markupReady) {
                return;
            }

            this.markupReady = true;
            container = $('.magnifier-container');

            $('body').addClass('magnifier').addClass(`magnifier-stage-${this.options.stage.position}`);

            this.lens = $('<div data-breeze-temporary>')
                .css({ position: 'absolute', visibility: 'hidden', left: 0, top: 0 })
                .addClass('image-magnifier-lens')
                .appendTo(this.element);

            this.lensImageWrapper = $('<div>').appendTo(this.lens);
            this.lensImage = $('<img alt="">').appendTo(this.lensImageWrapper);

            if (!container.length) {
                container = $('<div data-breeze-temporary>')
                    .addClass('magnifier-container')
                    .appendTo(document.body);
            }

            this.stage = container.find(`[data-url="${this.image.attr('src')}"]`);

            if (!this.stage.length) {
                this.stage = $(`<div data-breeze-temporary data-url="${this.image.attr('src')}">`)
                    .css({ position: 'absolute', visibility: 'hidden' })
                    .addClass(`image-magnifier-stage image-magnifier-stage-${this.options.stage.position}`)
                    .appendTo(container)
                    .append('<div><img alt=""></div>');
            }

            this.stageImageWrapper = this.stage.find('div');
            this.stageImage = this.stage.find('img');

            this.options.timeout = parseFloat(this.stageImageWrapper.css('transition-duration')) * 1000;

            this.mode(this.options.mode);
        },

        status: function (flag) {
            if (typeof flag === 'undefined') {
                return this.state.enabled;
            }

            this.state.enabled = flag;

            if (!flag) {
                if (this.activateTimer) {
                    this.activateTimer = clearTimeout(this.activateTimer);
                }

                $('body').add(this.element).add(this.stage).add(this.lens)
                    .removeClass('magnifier-active');
                this.state.current = null;
            }
        },

        mode: function (mode) {
            if (!mode) {
                return this.state.mode;
            }

            if (mode === 'auto') {
                mode = 'stage';
            }

            this.state.mode = mode;
            this.lens.toggleClass(this.options.lens.shape, mode === 'lens');
            this.stage.toggle(mode === 'stage');
        },

        addEventListeners: function () {
            this.touchActive = false;
            this.touchTimer = false;

            if (isTouch) {
                this._on('contextmenu .breeze-gallery:not(.opened) .stage', (e) => e.preventDefault());
                this._on('mousedown .breeze-gallery:not(.opened) .stage', (e) => e.preventDefault());
                this._on('.breeze-gallery .images', 'contextmenu', (e) => e.preventDefault());
                this._on('.breeze-gallery .images', 'mousedown', (e) => e.preventDefault());
            }

            this._on(isTouch ? 'touchmove' : 'mousemove', this.onMouseMove);

            this._on('touchstart', (e) => {
                if (this.touchTimer || this.gallery.opened()) {
                    return;
                }

                this.touchTimer = setTimeout(() => {
                    this.touchTimer = null;
                    this.touchActive = true;
                    this.onMouseMove(e);
                }, 250);
            });

            this._on(document, 'scroll', () => {
                this.touchTimer = clearTimeout(this.touchTimer);
                this.touchActive = false;
            });

            this._on(document, 'scroll', _.debounce(() => {
                if (this.isLoaded()) {
                    this.updateSizeAndPosition();
                }
            }, 500));

            this._on('.breeze-gallery .images', 'scroll', () => {
                this.touchTimer = clearTimeout(this.touchTimer);
                this.touchActive = false;
            });

            this._on(isTouch ? 'touchend' : 'mouseleave', () => {
                if (this.activateTimer) {
                    this.activateTimer = clearTimeout(this.activateTimer);
                }

                this.touchTimer = clearTimeout(this.touchTimer);
                this.touchActive = false;
                this.isMouseOver = false;

                if (!this.markupReady) {
                    return;
                }

                $('body').add(this.element).removeClass('magnifier-active');

                setTimeout(() => {
                    this.stage.add(this.lens).removeClass('magnifier-active');
                }, this.options.timeout);
            });

            this._on(document, 'breeze:resize-x', () => {
                if (this.isLoaded()) {
                    this.status(true);
                    this.apply();
                }
            });
        },

        onMouseMove: async function (e) {
            this.isMouseOver = true;
            this.pageX = e.changedTouches ? e.changedTouches[0].pageX : e.pageX;
            this.pageY = e.changedTouches ? e.changedTouches[0].pageY : e.pageY;

            if (!this.status() || (isTouch && !this.touchActive)) {
                return;
            }

            this.prepareMarkup();

            if (!this.isLoaded()) {
                await this.loadAndApply();
            } else if (!this.isApplied()) {
                this.apply();
            }

            if (!this.status() || !this.isMouseOver) {
                return;
            }

            if (e.cancelable) {
                e.preventDefault();
            }

            this.move();

            if (!this.activateTimer) {
                this.activateTimer = setTimeout(() => {
                    this.element.removeAttr('title');
                    $('body').add(this.element).add(this.stage).add(this.lens)
                        .addClass('magnifier-active');
                }, this.options.timeout);
            }
        },

        isLoaded: function () {
            return this.memo[this.image.attr('src')]?.width > 0;
        },

        isApplied: function () {
            return this.state.current === this.image.attr('src');
        },

        loadAndApply: async function () {
            var src = this.image.attr('src');

            if (this.memo[src]) {
                return;
            }

            this.stageImage.attr('src', '');
            this.lensImage.attr('src', '');

            this.memo[src] = {};
            this.element.spinner(true, { delay: 200 });
            this.memo[src] = await this.gallery.loadFullImage(this.imageIndex);
            this.element.spinner(false);
            this.apply();
        },

        apply: function () {
            var data = this.memo[this.image.attr('src')],
                bgWidth = data.width / window.devicePixelRatio,
                bgHeight = data.height / window.devicePixelRatio,
                zoom = Math.max(bgWidth / this.image.width(), bgHeight / this.image.height()),
                upscale = 1, deltaMin, deltaMax;

            // When image is too small to provide minimum zoom - stretch it.
            // Or, when image is too big - shrink to max zoom level.
            if (this.options.zoom !== 'auto') {
                upscale = this.options.zoom / zoom;
                zoom = this.options.zoom;
            } else if (this.options.zoomMin || this.options.zoomMax) {
                deltaMin = this.options.zoomMin / zoom;
                deltaMax = this.options.zoomMax / zoom;

                if (deltaMin && deltaMin > 1) {
                    zoom = this.options.zoomMin;
                    upscale = deltaMin;
                } else if (deltaMax && deltaMax < 1) {
                    zoom = this.options.zoomMax;
                    upscale = deltaMax;
                }
            }

            if (upscale !== 1) {
                bgWidth *= upscale;
                bgHeight *= upscale;
            }

            this.state.current = this.image.attr('src');
            this.state.zoom = zoom;
            this.state.upscale = upscale;
            this.state.offsetX = (this.image.offset().left - this.element.offset().left) * zoom;

            this.status(upscale <= this.options.upscale);
            this.mode(this.options.mode);
            this.updateSizeAndPosition(bgWidth, bgHeight);
        },

        updateSizeAndPosition: function (bgWidth, bgHeight) {
            var data = this.memo[this.image.attr('src')],
                imageWidth = this.image.width(),
                imageHeight = this.image.height(),
                imageRatio = imageWidth / imageHeight,
                bgRatio = bgWidth / bgHeight,
                image = this.stageImage,
                imageWrapper = this.stageImageWrapper,
                lensWidth, lensHeight;

            // switch mode to lens if there is no space for stage
            if (this.mode() === 'stage') {
                this.stage
                    .css({ width: 0, height: 0 })
                    .css(this.calculateStageSizeAndPosition());

                if (parseFloat(this.stage.css('width')) < 150 ||
                    this.image.closest('.images').css('overflow') === 'auto'
                ) {
                    // eslint-disable-next-line max-depth
                    if (this.options.mode === 'auto') {
                        this.mode('lens');
                    } else {
                        this.status(false);
                    }
                }
            }

            if (this.mode() === 'stage') {
                lensWidth = this.stage.width() / this.state.zoom;
                lensHeight = this.stage.height() / this.state.zoom;

                this.lensImageWrapper.css({
                    width: this.element.width(),
                    height: this.element.height()
                });

                this.lensImage.attr({
                    src: this.image[0].currentSrc,
                    width: this.image.width(),
                    height: this.image.height()
                });

                if (!this.image[0].currentSrc) {
                    this.image.one('load', function setLensBackground() {
                        this.image.off('load', setLensBackground);
                        this.lensImage.attr('src', this.image[0].currentSrc);
                    }.bind(this));
                }
            } else {
                image = this.lensImage;
                imageWrapper = this.lensImageWrapper;
                lensWidth = this.options.lens.width;
                lensHeight = this.options.lens.height;
            }

            this.lens.css({ width: lensWidth, height: lensHeight });
            image.attr({ src: data.src, width: bgWidth, height: bgHeight });
            imageWrapper.css({ width: bgWidth, height: bgHeight });

            // sync large image and small image ratios
            if (imageRatio !== bgRatio) {
                if (bgWidth < imageWidth) {
                    imageWrapper.css('width', bgHeight * imageRatio);
                } else if (bgHeight < imageHeight) {
                    imageWrapper.css('height', bgWidth / imageRatio);
                } else if (bgRatio > imageRatio) {
                    imageWrapper.css('height', bgWidth / imageRatio);
                } else if (bgRatio < imageRatio) {
                    imageWrapper.css('width', bgHeight * imageRatio);
                }
            }
        },

        calculateStageSizeAndPosition: function () {
            var stage = this.options.stage;

            if (stage.position === 'inner') {
                return {
                    width: this.element.width(),
                    height: this.element.height(),
                    top: this.element.offset().top + parseFloat(this.element.css('border-top-width')),
                    left: this.element.offset().left + parseFloat(this.element.css('border-left-width'))
                };
            }

            // eslint-disable-next-line one-var, vars-on-top
            var shift = parseFloat(window.getComputedStyle(this.element[0]).getPropertyValue('--magnifier-gap')),
                leftPosition = this.element.offset().left - this.element.width() - shift,
                rightPosition = this.element.offset().left + this.element.width() + shift,
                result = {
                    width: this.convertSize(stage.width),
                    height: this.convertSize(stage.height),
                    top: this.element.offset().top + parseFloat(this.element.css('border-top-width')),
                    left: stage.position === 'right' ? rightPosition : leftPosition
                };

            if (result.left < 0) {
                result.width += result.left - shift;
                result.left = shift;
            } else if (result.left + result.width > $(window).width()) {
                result.width -= result.left + result.width - $(window).width() + shift;
            }

            return result;
        },

        convertSize: function (size) {
            size += '';

            if (size.includes('w')) {
                return parseFloat(size) * this.element.width() / 100;
            }

            if (size.includes('h')) {
                return parseFloat(size) * this.element.height() / 100;
            }

            return parseFloat(size);
        },

        move: function () {
            var rect = this.element.get(0).getBoundingClientRect(),
                pos = {
                    x: this.pageX - rect.left - window.pageXOffset,
                    y: this.pageY - rect.top - window.pageYOffset,
                },
                zoom = this.state.zoom,
                lensWidth = this.lens.outerWidth(),
                lensHeight = this.lens.outerHeight(),
                lensX = pos.x - lensWidth / 2,
                lensY = pos.y - lensHeight / 2,
                imageX, imageY,
                rafs = [];

            if (this.mode() === 'lens') {
                imageX = pos.x * zoom - lensWidth / 2 - this.state.offsetX;
                imageY = pos.y * zoom - lensHeight / 2;

                // move lens above the finger
                if (isTouch) {
                    lensY -= lensWidth / 2 + 12;
                }

                // keep lens inside viewport to prevent scrollbars
                if (!this.rtl && lensX + rect.left + lensWidth > $(window).width()) {
                    lensX = $(window).width() - lensWidth - rect.left;
                } else if (this.rtl && lensX + rect.left < 0) {
                    lensX = -rect.left;
                }

                if (lensY + rect.top < 0) {
                    lensY = -rect.top;
                }
            } else {
                imageX = lensX = Math.max(0, Math.min(lensX, this.element.width() - lensWidth));
                imageY = lensY = Math.max(0, Math.min(lensY, this.element.height() - lensHeight));
                rafs.push(() => {
                    this.stageImageWrapper.css({
                        // eslint-disable-next-line max-len
                        transform: `translate3d(${(lensX * zoom - this.state.offsetX) * -1}px, ${lensY * zoom * -1}px, 0px)`
                    });
                });
            }

            imageX += 1;
            imageY += 1;

            $.raf(() => {
                rafs.forEach(fn => fn());
                this.lensImageWrapper.css({
                    transform: `translate3d(${imageX * -1}px, ${imageY * -1}px, 0px)`
                });
                this.lens.css({
                    transform: `translate3d(${lensX}px, ${lensY}px, 0px)`
                });
            });
        }
    });

    function getMagnifierElement(gallery) {
        return gallery.imagesWrapper.length ?
            gallery.imagesWrapper.find('.item') : gallery.element;
    }

    function onGalleryChange(gallery) {
        var magnifierElement = getMagnifierElement(gallery),
            options = gallery.options.magnifierOpts;

        if (!options || options.enabled === false || gallery.opened()) {
            return;
        }

        magnifierElement.each((i, el) => {
            if (!$(el).magnifier('instance')) {
                $(el).magnifier(options);
            }
        });

        magnifierElement.magnifier('status', false);

        if (!gallery.opened() && !gallery.stage.hasClass('video')) {
            // wait for panzoom to reset scale
            setTimeout(() => {
                magnifierElement.magnifier('status', true);
            }, 20);
        }
    }

    $(document).on('gallery:loaded', (e, data) => {
        var options = data.instance.options.magnifierOpts;

        if (!options || options.enabled === false) {
            return;
        }

        getMagnifierElement(data.instance).magnifier(options);
    });
    $(document).on('gallery:beforeOpen', (e, data) => {
        getMagnifierElement(data.instance).magnifier('status', false);
    });
    $(document).on('gallery:afterClose', (e, data) => {
        onGalleryChange(data.instance);
    });
    $(document).on('gallery:afterActivate', (e, data) => {
        onGalleryChange(data.instance);
    });
}());
