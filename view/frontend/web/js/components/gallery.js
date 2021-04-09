/* global breeze _ */
(function () {
    'use strict';

    breeze.widget('gallery', {
        options: {
            video: {
                template: '<div class="video-wrapper"><iframe src="<%- src %>"' +
                    ' width="<%- width %>" height="<%- height %>" frameborder="0" allowfullscreen' +
                    ' allow="accelerometer; autoplay; clipboard-write;' +
                    ' encrypted-media; gyroscope; picture-in-picture"></iframe></div>',
                providers: [{
                    name: 'youtube',
                    regexs: [
                        /youtube\.com\/watch\?v=([a-zA-Z0-9]+)/,
                        /youtu\.be\/([a-zA-Z0-9]+)/
                    ],
                    params: {
                        width: 560,
                        height: 315,
                        src: 'https://www.youtube.com/embed/$id'
                    }
                }, {
                    name: 'vimeo',
                    regexs: [
                        /vimeo\.com\/(\d+)/
                    ],
                    params: {
                        width: 640,
                        height: 380,
                        src: 'https://player.vimeo.com/video/$id'
                    }
                }]
            }
        },

        /** [create description] */
        create: function () {
            this.options = _.extend(this.options, this.options.options || {});
            this.gallery = this.element.parent();
            this.parent = this.gallery.parent();
            this.thumbs = this.gallery.find('.thumbnails a');
            this.stage = this.gallery.find('.stage');
            this.image = this.stage.find('.stage img');
            this.activeIndex = this.gallery.find('.thumbnails a.active').index();

            if (this.activeIndex === -1) {
                this.activeIndex = 0;
            }

            this.activate(this.activeIndex);
            this.addEventListeners();
        },

        /** [addEventListeners description] */
        addEventListeners: function () {
            var self = this;

            this.image.on('load error', function () {
                $.fn.blockLoader().hide(self.stage);
            });

            this.stage
                .on('click', '.next', function (event) {
                    event.preventDefault();
                    self.next();
                })
                .on('click', '.prev', function (event) {
                    event.preventDefault();
                    self.prev();
                })
                .on('click', '.main-image-wrapper', function () {
                    if (self.options.data[self.activeIndex].videoUrl) {
                        self.play();
                    } else {
                        self.open();
                    }
                });

            this.thumbs.on('click', function (event) {
                var index = $(this).index();

                event.preventDefault();

                if (index !== self.activeIndex) {
                    self.activate($(this).index());
                } else {
                    self.open();
                }
            });

            this.gallery
                .on('click', function () {
                    if (self.gallery.is(':focus-within')) {
                        return;
                    }

                    this.focus({
                        preventScroll: true
                    });
                })
                .find('.close').on('click', function (event) {
                    event.preventDefault();
                    self.close();
                });

            $(document).on('keydown', function (event) {
                if (self.options.keyboard === false) {
                    return;
                }

                if (!self.gallery.hasClass('opened') &&
                    !self.gallery.is(':focus-within')
                ) {
                    return;
                }

                switch (event.keyCode || event.which) {
                    case $.key.ESCAPE:
                        self.close();
                        break;

                    case $.key.LEFT:
                        event.preventDefault();
                        self.prev();
                        break;

                    case $.key.RIGHT:
                        event.preventDefault();
                        self.next();
                        break;
                }
            });
        },

        /** Activate prev image */
        prev: function () {
            var index = this.activeIndex - 1;

            if (index < 0 || !this.thumbs.eq(index).length) {
                index = this.options.loop !== false ? this.thumbs.length - 1 : 0;
            }

            this.activate(index);
        },

        /** Activate next image */
        next: function () {
            var index = this.activeIndex + 1;

            if (!this.thumbs.eq(index).length) {
                index = this.options.loop !== false ? 0 : this.activeIndex;
            }

            this.activate(index);
        },

        /** Activate image by its index */
        activate: function (index) {
            var data = this.options.data[index],
                fullscreen = this.gallery.hasClass('opened');

            if (!data) {
                return;
            }

            this.thumbs.eq(this.activeIndex).removeClass('active');
            this.thumbs.eq(index).addClass('active');
            this.image.attr('src', fullscreen ? data.full : data.img);
            this.stage.toggleClass('video', data.videoUrl);

            if (!this.image.get(0).complete && !data.videoUrl) {
                $.fn.blockLoader().show(this.stage);
            }

            // scroll to hidden thumbnail only if we will not affect page scroll offset
            if (fullscreen || this.isInViewport(this.thumbs)) {
                this.thumbs.eq(index).focus();
            }

            if (this.activeIndex !== index) {
                this.stage.find('.video-wrapper').remove();
            }

            this.activeIndex = index;
        },

        /** Open fullscreen gallery */
        open: function () {
            if (this.gallery.hasClass('opened') || this.options.allowfullscreen === false) {
                return;
            }

            this.image.removeAttr('width').removeAttr('height');

            this.parent.css({
                width: this.parent.width(),
                height: this.parent.height()
            });
            $('body').addClass('_has-modal');
            this.gallery.addClass('opened');
            this.activate(this.activeIndex);
        },

        /** Close fullscreen gallery */
        close: function () {
            this.image
                .removeAttr('src')
                .attr('width', this.options.width)
                .attr('height', this.options.height);

            this.gallery.removeClass('opened');
            this.activate(this.activeIndex);
            $('body').removeClass('_has-modal');
            this.parent.css({
                width: '',
                height: ''
            });
        },

        /** Plays active video */
        play: function () {
            var url = this.options.data[this.activeIndex].videoUrl,
                params;

            _.find(this.options.video.providers, function (item) {
                return _.find(item.regexs, function (regex) {
                    var match = regex.exec(url);

                    if (match) {
                        params = _.extend({}, item.params);
                        params.src = params.src.replace('$id', match[1]);
                    }

                    return match;
                });
            });

            this.stage.prepend(
                _.template(params.template || this.options.video.template)(params)
            );
        },

        isInViewport: function (el) {
            var rect = el.get(0).getBoundingClientRect();

            return rect.top >= 0 && rect.bottom <= $(window).height();
        }
    });

    $(document).on('breeze:mount:mage/gallery/gallery', function (event, data) {
        $(data.el).gallery(data.settings);
    });
})();
