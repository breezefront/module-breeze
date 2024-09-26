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
                    '<button class="<%- css %> slick-arrow" aria-label="<%- label %>" type="button">',
                        '<%- label %>',
                    '</button>'
                ].join(''),
                dots: [
                    '<ul class="slick-dots" role="tablist">',
                        '<% _.each(dots, function(dot) { %>',
                            '<li class="<%- dot.css %>" role="tab">',
                                '<button type="button" aria-label="<%- dot.ariaLabel %>">',
                                    '<%- dot.label %>',
                                '</button>',
                            '</li>',
                        '<% }) %>',
                    '</ul>'
                ].join(''),
                skip: [
                    '<a href="#<%- id %>" class="action skip">',
                        '<%- label %>',
                    '</a>'
                ].join(''),
                anchor: [
                    '<span id="<%- id %>" class="anchor skip"></span>'
                ].join(''),
            }
        },

        create: function () {
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

            this.prepareMarkup();
            this.buildPagination();
            this.addEventListeners();
            this.element.addClass('slick-initialized');
            this.updateScrollOffset();

            if (this.element.hasClass('containered') && matchMedia('(min-width: 1024px)').matches) {
                this.scrollToPage(1, true); // hide empty space before first slide
            }

            if (this.options.autoplay) {
                this.start();
            }
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

            this.element.prepend(_.template(this.options.templates.skip)({
                id: 'slider-' + this.uuid + '-end',
                label: $.__('Skip carousel')
            }));
            this.element.after(_.template(this.options.templates.anchor)({
                id: 'slider-' + this.uuid + '-end'
            }));

            this.slider = this.element.find('.slick-list');
            this.slides = this.slider.children();
            this.nextEl = this.element.find('.slick-next');
            this.prevEl = this.element.find('.slick-prev');
        },

        addEventListeners: function () {
            var self = this,
                lastResize = new Date(),
                updateScrollOffsetAndPagination = _.debounce(() => {
                    this.updateScrollOffset();
                    this.update();
                }, 200);

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

            this.slider.on('scroll', _.debounce(() => {
                var now = new Date();

                if (now - lastResize <= 200) {
                    return;
                }

                this.updateCurrentPage();
            }, 40));

            new ResizeObserver(() => {
                lastResize = new Date();
                updateScrollOffsetAndPagination();
            }).observe(this.slider.get(0));

            this.slides.each((i, slide) => {
                new MutationObserver(function (records) {
                    if (records[0].oldValue?.match(/display:\s*none/)) {
                        updateScrollOffsetAndPagination();
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
                };

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
                            this.slider.css('transform', `translateX(
                                ${(this.slider[0].scrollLeft + pos.dx - pos.left) / 5}px
                            )`);
                            this.element.css('overflow', 'hidden');
                        }

                        this.element.css('user-select', 'none');
                        this.slider.css({
                            'scroll-behavior': 'auto',
                            'scroll-snap-type': 'none',
                        });
                    })
                    .on('mouseup.sliderMouseDrag', () => {
                        var scrollTo = this.page,
                            percent = pos.dx / (this.slider.width() || 1);

                        if (percent > 0.1 && scrollTo) {
                            scrollTo--;
                        } else if (percent < -0.1 && scrollTo < this.pages.length - 1) {
                            scrollTo++;
                        }

                        $(document).off('.sliderMouseDrag');

                        if (pos.dx) {
                            this.scrollToPage(scrollTo, 'smooth');
                            $(document).one('click', e => e.preventDefault());
                        }

                        this.element.css('user-select', '');
                        this.slider.css('transition', 'transform 100ms ease-in-out');
                        this.slider.css('transform', '');

                        setTimeout(() => {
                            this.slider.css('transition', '');
                        }, 100);

                        // restore styles after scroll (onscrollend)
                        timer = setTimeout(() => {
                            this.element.css('overflow', '');
                            this.slider.css({
                                'scroll-behavior': '',
                                'scroll-snap-type': '',
                            });
                        }, 800);
                    });
            });
        },

        buildPagination: function () {
            var self = this,
                pageNumTmp = 0,
                pageWidthTmp = 0,
                sliderWidth = this.slider.outerWidth(),
                sliderLeft = this.slider.get(0).scrollLeft,
                dotsTpl = _.template(this.options.templates.dots),
                dots = [];

            this.pages = [];

            this.slides.each(function (index) {
                if (index && pageWidthTmp + this.clientWidth > sliderWidth) {
                    pageWidthTmp = 0;
                    pageNumTmp++;
                }

                if (!self.pages[pageNumTmp]) {
                    self.pages[pageNumTmp] = {
                        slides: [],
                        start: Math.floor($(this).position().left + sliderLeft),
                        end: Math.ceil($(this).position().left + sliderLeft)
                    };
                }

                pageWidthTmp += this.clientWidth;
                self.pages[pageNumTmp].slides.push(index);
                self.pages[pageNumTmp].end += this.clientWidth;

                // keep active slide in the viewport
                if (index === self.slide) {
                    self.page = pageNumTmp;
                }
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
        },

        updateCurrentPage: function () {
            var pageNum = this.page,
                page = this.pages[pageNum],
                offset = this.slider.get(0).scrollLeft - (this.scrollOffset || 0),
                delta = 2,
                width = this.slider.outerWidth(),
                diffStart = Math.abs(page.start - offset),
                pageUpdated = false;

            if (diffStart > delta) { // rounding issues
                $.each(this.pages, function (i) {
                    var diffTmp = Math.abs(this.start - offset);

                    // if whole page is visible (last page with less slides per view)
                    if (this.start >= offset && this.end <= offset + width + delta) {
                        pageNum = i;

                        return false;
                    }

                    if (diffTmp < diffStart) {
                        pageNum = i;
                        diffStart = diffTmp;
                    }
                });

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

            arrows.show();

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
                if (!this.options.infinite) {
                    return false;
                }

                page = 0;
            }

            this.scrollToPage(page);
        },

        prev: function () {
            var page = this.page - 1;

            if (page < 0) {
                if (!this.options.infinite) {
                    return false;
                }

                page = this.pages.length - 1;
            }

            this.scrollToPage(page);
        },

        scrollToPage: function (page, instant) {
            var slider = this.slider.get(0),
                slide = this.slides.eq(this.pages[page].slides[0]),
                pageUpdated = false,
                behavior = 'auto';

            if (instant) {
                behavior = instant === 'smooth' ? 'smooth' : 'instant';
            }

            this.dots.removeClass('slick-active')
                .eq(page)
                .addClass('slick-active');
            slider.scrollTo({
                left: slider.scrollLeft -
                    parseFloat(getComputedStyle(slider).getPropertyValue('padding-left')) +
                    slide.position().left +
                    this.scrollOffset || 0, // offset when scroll-snap-align: center is used
                behavior: behavior
            });

            if (this.page !== page) {
                pageUpdated = true;
            }

            this.page = page;
            this.slide = slide.index();

            if (pageUpdated) {
                this._trigger('slideChange');
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

        updateScrollOffset: function () {
            this.scrollOffset = this.slider.offset().left
                - this.slides.eq(this.pages[this.page].slides[0]).offset().left;
        },

        update: function () {
            this.slides = this.slider.children();
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
