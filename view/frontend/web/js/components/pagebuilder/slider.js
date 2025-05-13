(function () {
    'use strict';

    $.widget('pagebuilderSlider', {
        component: 'Magento_PageBuilder/js/content-type/slider/appearance/default/widget',
        options: {
            autoplay: false,
            autoplaySpeed: 5000,
            infinite: false,
            arrows: true,
            dots: false,
            templates: {
                arrow: [
                    '<button class="<%- css %> slick-arrow" aria-label="<%- label %>" type="button" tabindex="-1">',
                        '<%- label %>',
                    '</button>'
                ].join(''),
                dots: [
                    '<ul class="slick-dots" role="tablist">',
                        '<% _.each(dots, function(dot) { %>',
                            '<li class="<%- dot.css %>" role="tab">',
                                '<button type="button" aria-label="<%- dot.ariaLabel %>" tabindex="-1">',
                                    '<span><%- dot.label %></span>',
                                '</button>',
                            '</li>',
                        '<% }) %>',
                    '</ul>'
                ].join(''),
            }
        },

        create: function () {
            this.element.a11y('skippable', {
                id: 'slider-' + this.uuid + '-end',
                label: $.__('Skip carousel')
            });

            this.onReveal(this.createSlider.bind(this));
        },

        createSlider: function () {
            this.page = 0;
            this.slide = 0;

            $.each({
                autoplay: 'autoplay',
                autoplaySpeed: 'autoplay-speed',
                infinite: 'infinite-loop',
                arrows: 'show-arrows',
                dots: 'show-dots'
            }, (key, domKey) => {
                var value = this.element.data(domKey);

                if (value !== undefined) {
                    this.options[key] = value;
                }
            });

            this.options.infinite = this.options.infinite || this.element.hasClass('containered');

            this.prepareMarkup();

            setTimeout(async () => {
                await this.buildPagination();
                this.element.addClass('slick-initialized');
                this.addEventListeners();

                if (this.options.autoplay) {
                    this.start();
                }

                this._trigger('ready');
            });
        },

        destroy: function () {
            this.element.removeClass('slick-initialized');
            this._super();
        },

        prepareMarkup: function () {
            var arrowTpl = _.template(this.options.templates.arrow);

            if (this.options.slider) {
                this.options.slider.addClass('slick-list');
            } else if (!this.element.find('.slick-list').length) {
                this.element.wrapInner('<div class="slick-list">');
            }

            if (this.options.arrows && !this.element.find('.slick-next').length) {
                this.element.prepend(arrowTpl({
                    css: 'slick-prev',
                    label: $.__('Previous')
                }));
                this.element.append(arrowTpl({
                    css: 'slick-next',
                    label: $.__('Next')
                }));
            }

            this.element.prepend(this.element.find('.action.skip'));

            this.slider = this.element.find('.slick-list');
            this.slides = this.slider.children();
            this.nextEl = this.element.find('.slick-next');
            this.prevEl = this.element.find('.slick-prev');

            if (!this.slides.first().find('a, button').length) {
                this.slider.attr('tabindex', 0);
            }
        },

        addEventListeners: function () {
            var self = this,
                scrollToTimer,
                isFirstResize = true,
                lastResize = new Date(),
                debouncedUpdate = _.debounce(this.update.bind(this), 200),
                throttledUpdateCurPage = _.throttle(this.updateCurrentPage.bind(this), 50);

            if (!this.slider.length) {
                return;
            }

            this.handleMouseDrag();

            this.element
                .on('click', this.stop.bind(this))
                .on('click', '.slick-next, .slick-prev', function (event) {
                    event.preventDefault();

                    if ($(this).closest('.slick-initialized').is(self.element)) {
                        self[$(this).hasClass('slick-prev') ? 'prev' : 'next']();
                    }
                })
                .on('click', '.slick-dots li', function (event) {
                    event.preventDefault();

                    if ($(this).closest('.slick-initialized').is(self.element)) {
                        self.scrollToPage($(this).index());
                    }
                })
                .hover(this.pause.bind(this), this.start.bind(this));

            this.slider.on('scroll', () => {
                var now = new Date(),
                    overscrollLeft = this.slider[0].scrollLeft - this.scrollMin,
                    overscrollRight = this.slider[0].scrollLeft - this.scrollMax;

                if (now - lastResize <= 200) {
                    return;
                }

                if (this.options.infinite) {
                    clearTimeout(scrollToTimer);

                    if (overscrollLeft <= 0) {
                        return this.scrollToPage(this.pages.length - 1, 'instant');
                    } else if (overscrollLeft <= 2) {
                        scrollToTimer = setTimeout(() => this.scrollToPage(this.pages.length - 1, 'instant'), 200);
                        return;
                    }

                    if (overscrollRight >= 0) {
                        return this.scrollToPage(0, 'instant');
                    } else if (overscrollRight >= -2) {
                        scrollToTimer = setTimeout(() => this.scrollToPage(0, 'instant'), 200);
                        return;
                    }
                }

                throttledUpdateCurPage();
            });

            new ResizeObserver(() => {
                if (isFirstResize) {
                    isFirstResize = false;
                    return;
                }

                if (this.slider.data('breeze-prev-width') !== this.slider.width()) {
                    this.slider.data('breeze-prev-width', this.slider.width());
                    lastResize = new Date();
                    debouncedUpdate();
                }
            }).observe(this.slider.get(0));

            this.slides.each((i, slide) => {
                new MutationObserver(function (records) {
                    if (records[0].oldValue?.match(/display:\s*none/)) {
                        debouncedUpdate();
                    }
                }).observe(slide, {
                    attributeFilter: ['style'],
                    attributeOldValue: true
                });
            });
        },

        handleMouseDrag: function () {
            var touching = false,
                timer;

            this._on({
                touchstart: () => { touching = true; },
                touchend: () => { touching = false; },
            });

            this._on('mousedown', event => {
                var pos = {
                        dx: 0,
                        left: this.slider[0].scrollLeft,
                        x: event.clientX,
                    },
                    initialPage = this.page;

                if (touching) {
                    return;
                }

                event.preventDefault();

                $(document)
                    .on('mousemove.sliderMouseDrag', e => {
                        e.preventDefault();

                        clearTimeout(timer);
                        pos.dx = e.clientX - pos.x;
                        this.slider[0].scrollLeft = pos.left - pos.dx;

                        if (this.slider[0].scrollLeft !== pos.left - pos.dx) {
                            $.raf(() => {
                                this.slider.css('transform', `translateX(
                                    ${(this.slider[0].scrollLeft + pos.dx - pos.left) / 5}px
                                )`);
                            });
                            this.element.css('overflow', 'hidden');
                        }

                        this.element.css('user-select', 'none');
                        this.slider.css({
                            'scroll-behavior': 'auto',
                            'scroll-snap-type': 'none',
                            'interactivity': 'inert',
                        });
                    })
                    .on('mouseup.sliderMouseDrag', () => {
                        var scrollTo = initialPage,
                            percent = pos.dx / (this.slider.width() || 1);

                        if (percent > 0.1) {
                            scrollTo -= Math.max(1, Math.ceil(percent));
                        } else if (percent < -0.1) {
                            scrollTo += Math.max(1, Math.ceil(Math.abs(percent)));
                        }

                        $(document).off('.sliderMouseDrag');

                        if (pos.dx) {
                            if (scrollTo >= 0 && scrollTo < this.pages.length) {
                                this.scrollToPage(scrollTo, 'smooth');
                            } else if (this.options.infinite) {
                                this.scrollToPageClone(scrollTo < 0 ? -1 : 0);
                            }
                            $(document).one('click', e => e.preventDefault());
                        }

                        this.element.css('user-select', '');
                        this.slider.css('transition', 'transform 100ms ease-in-out');
                        $.raf(() => {
                            this.slider.css('transform', '');
                            setTimeout(() => this.slider.css('transition', ''), 100);
                        });

                        // restore styles after scroll (onscrollend)
                        timer = setTimeout(() => {
                            this.element.css('overflow', '');
                            this.slider.css({
                                'scroll-behavior': '',
                                'scroll-snap-type': '',
                                'interactivity': '',
                            });
                        }, 800);
                    });
            });
        },

        buildPagination: async function () {
            var self = this,
                sliderLeft = 0,
                fauxOffset = 0,
                pageNumTmp = 0,
                pageWidthTmp = 0,
                gap = parseFloat(this.slider.css('column-gap')) || 0,
                sliderWidth = this.slider.outerWidth(),
                dotsTpl = _.template(this.options.templates.dots),
                dots = [];

            if (this.pages?.length) {
                this.slider.find('[data-clone]').remove();
                this.scrollTo(0, 'instant');
            }

            sliderLeft = this.slider.get(0).scrollLeft;
            fauxOffset = parseFloat(
                getComputedStyle(this.slider[0], ':before').getPropertyValue('width')
            ) || 0;

            if (fauxOffset) {
                fauxOffset += gap;
                // wait until scrolling is stopped
                while (!sliderLeft) {
                    await $.sleep(200);
                    sliderLeft = this.slider.get(0).scrollLeft;
                }
            }

            this.pages = [];
            this.scrollOffset = this.slider.offset().left - this.slides.first().offset().left;
            this.slides.removeAttr('data-page-start').each(function (index) {
                var slide = $(this).attr('data-index', index),
                    slideWidth = $(this).width();

                if (!slideWidth && (slide.is('img') || slide.find('img').length)) {
                    console.error(
                        [
                            'Slide width must be greater than 0.',
                            'Consider adding width attribute for <img> tags.',
                        ].join(' '),
                        this
                    );
                }

                if (index && (pageWidthTmp >= sliderWidth || pageWidthTmp + slideWidth > sliderWidth)) {
                    pageWidthTmp = 0;
                    pageNumTmp++;
                } else if (self.pages[pageNumTmp]) {
                    self.pages[pageNumTmp].end += gap;
                }

                if (!self.pages[pageNumTmp]) {
                    self.pages[pageNumTmp] = {
                        idx: '',
                        slides: [],
                        start: slide.position().left + sliderLeft - fauxOffset + self.scrollOffset,
                        end: slide.position().left + sliderLeft - fauxOffset + self.scrollOffset,
                    };
                    slide.attr('data-page-start', pageNumTmp);
                }

                pageWidthTmp = pageWidthTmp || Math.abs(self.scrollOffset);
                pageWidthTmp += slideWidth + gap;
                self.pages[pageNumTmp].slides.push(index);
                self.pages[pageNumTmp].end += slideWidth;
                self.pages[pageNumTmp].idx += index;

                // keep active slide in the viewport
                if (index === self.slide) {
                    self.page = pageNumTmp;
                }
            });

            this.pages.forEach(page => {
                page.start = Math.round(page.start);
                page.end = Math.round(page.end);
            });

            if (this.options.dots) {
                this.element.find('.slick-dots').remove();

                if (this.pages.length > 1) {
                    $.each(this.pages, function (i) {
                        dots.push({
                            css: i === self.page ? 'slick-active' : '',
                            label: i + 1,
                            ariaLabel: i + 1 + '/' + self.pages.length
                        });
                    });
                    this.element.append(dotsTpl({
                        dots: dots
                    }));
                }
            }

            this.dots = this.element.find('.slick-dots').children();

            this.updateArrows();

            if (this.options.infinite && this.pages.length >= 2) {
                this.cloneSlides();
            }

            this.scrollToPage(this.page, 'instant');
        },

        cloneSlides: function () {
            var toClone = 2,
                gap = parseFloat(this.slider.css('column-gap')) || 0,
                offset = this.pages.at(-1).end - this.pages.at(-toClone).start + gap,
                cloned = -1,
                i;

            while (++cloned < toClone) {
                i = cloned % this.pages.length;
                this.pages.at(i).slides.forEach(slideIndex => {
                    this.slider.append(this.slides.eq(slideIndex).clone().attr('data-clone', 1));
                });
                [...this.pages.at(this.pages.length - i - 1).slides].reverse().forEach(slideIndex => {
                    this.slider.prepend(this.slides.eq(slideIndex).clone().attr('data-clone', 1));
                });
            }

            this.pages.forEach(page => {
                page.start += offset;
                page.end += offset;
            });

            this.scrollMin = this.pages.at(0).start - gap - (this.pages.at(-1).end - this.pages.at(-1).start);
            this.scrollMax = this.pages.at(-1).end + gap;
        },

        updateCurrentPage: function () {
            var pageNum = this.page,
                scrollLeft = this.slider.get(0).scrollLeft,
                delta = 2,
                width = this.slider.outerWidth(),
                diffStart = Math.abs(this.pages[pageNum].start - scrollLeft),
                pageUpdated = false;

            if (diffStart > delta) { // rounding issues
                this.pages.some((page, i) => {
                    var diffTmp = Math.abs(page.start - scrollLeft);

                    // if whole page is visible (last page with less slides per view)
                    if (page.start >= scrollLeft && page.end <= scrollLeft + width + delta) {
                        pageNum = i;

                        return true;
                    }

                    if (diffTmp < diffStart) {
                        pageNum = i;
                        diffStart = diffTmp;
                    }
                });

                if (this.options.infinite) {
                    if (scrollLeft > this.pages.at(-1).start + width / 2) {
                        pageNum = 0;
                    } else if (scrollLeft < this.pages.at(0).start - width / 2) {
                        pageNum = this.pages.length - 1;
                    }
                }

                if (this.page !== pageNum) {
                    pageUpdated = true;
                }

                this.page = pageNum;
                this.slide = this.pages[pageNum].slides[0];
            }

            this.dots.removeClass('slick-active')
                .eq(this.page)
                .addClass('slick-active');

            this.updateArrows();

            if (pageUpdated) {
                this._trigger('slideChange');
            }
        },

        updateArrows: function () {
            var arrows = this.nextEl.add(this.prevEl);

            if (this.pages.length < 2) {
                return arrows.hide();
            }

            arrows.css('display', 'block');

            if (this.options.infinite) {
                return;
            }

            arrows.prop('disabled', false)
                .attr('aria-disabled', false)
                .removeClass('slick-disabled');

            if (this.page === 0) {
                this.prevEl
                    .prop('disabled', true)
                    .attr('aria-disabled', true)
                    .addClass('slick-disabled');
            } else if (this.page === this.pages.length - 1) {
                this.nextEl
                    .prop('disabled', true)
                    .attr('aria-disabled', true)
                    .addClass('slick-disabled');
            }
        },

        next: function () {
            var page = this.page + 1;

            if (page >= this.pages.length) {
                return this.options.infinite ? this.scrollToPageClone(0) : false;
            }

            this.scrollToPage(page);
        },

        prev: function () {
            var page = this.page - 1;

            if (page < 0) {
                return this.options.infinite ? this.scrollToPageClone(-1) : false;
            }

            this.scrollToPage(page);
        },

        scrollToPageClone: function (index) {
            var left = 0,
                gap = parseFloat(this.slider.css('column-gap')) || 0;

            if (!index) {
                left = this.pages.at(-1).end + gap;
            } else {
                left = this.pages.at(0).start
                    - (this.pages.at(-1).end - this.pages.at(-1).start + gap);
            }

            this.scrollTo(left, 'smooth');
        },

        scrollToPage: function (page, instant) {
            var pageUpdated = false;

            this.scrollTo(this.pages[page].start, instant);

            if (this.page !== page) {
                pageUpdated = true;
            }

            this.page = page;
            this.slide = this.pages[page].slides[0];

            if (pageUpdated) {
                this._trigger('slideChange');
            }
        },

        scrollTo: function (left, instant) {
            var behavior = 'auto';

            if (instant) {
                behavior = instant === 'smooth' ? 'smooth' : 'instant';
            }

            this.slider[0].scrollTo({ left, behavior });

            if (behavior === 'instant') {
                this.slider.css('overflow', 'hidden');
                setTimeout(() => {
                    this.slider.css('overflow', '');
                });
            }
        },

        start: function () {
            if (!this.options.autoplay) {
                return;
            }

            this.timer = setTimeout(function () {
                var next = this.reverse ? this.prev : this.next,
                    prev = this.reverse ? this.next : this.prev;

                if (next.bind(this)() === false) {
                    this.reverse = !this.reverse;
                    prev.bind(this)();
                }

                this.start();
            }.bind(this), this.options.autoplaySpeed || 5000);
        },

        stop: function () {
            this.pause();
            this.options.autoplay = false;
        },

        pause: function () {
            clearTimeout(this.timer);
        },

        update: function () {
            this.slides = this.slider.children(':not([data-clone])');
            this.buildPagination();
        },

        addSlide: function (index, slides) {
            this.slides.eq(index).before(slides);
            this.update();
        },

        removeSlide: function (index) {
            this.slides.eq(index).remove();
            this.update();
        }
    });
})();
