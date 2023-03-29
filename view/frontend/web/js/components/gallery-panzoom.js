(function () {
    'use strict';

    $.widget('panzoom', {
        options: {
            canvas: true,
            maxScale: 4,
            minScale: 1,
            // contain: 'outside',
            disablePan: true,
            disableZoom: true,
            touchAction: '',
            cursor: false,
            step: 0.5
        },

        create: function () {
            // eslint-disable-next-line no-undef
            this.panzoom = Panzoom(this.element[0], this.options);
            this.addEventListeners();
        },

        addEventListeners: function () {
            this._on('panzoomzoom', (e) => {
                if (e.detail.scale === 1) {
                    if (e.detail.x !== 0 || e.detail.y !== 0) {
                        this.panzoom.pan(0, 0);
                    }
                }

                this.panzoom.setOptions({
                    disablePan: e.detail.scale === 1
                });
            });

            this.element[0].addEventListener('wheel', (e) => {
                if (!$(e.currentTarget).is('.opened .stage:not(.video) .main-image-wrapper')) {
                    return;
                }

                this.panzoom.zoomWithWheel(e);
            }, {
                passive: true
            });

            this.element.closest('.stage')
                .on('swiped-left swiped-right', (e) => {
                    if (this.panzoom.getScale() > 1) {
                        e.stopImmediatePropagation(); // prevent next/prev
                    }
                })
                .on('click', '.zoom', (e) => {
                    e.preventDefault();
                    this.panzoom[$(e.currentTarget).hasClass('zoom-out') ? 'zoomOut' : 'zoomIn']();
                })
                .on('dblclick dbltap', '.main-image-wrapper', (e) => {
                    if (this.disabledDblClick) {
                        return;
                    }

                    if (this.panzoom.getScale() >= this.options.maxScale) {
                        this.panzoom.pan(0, 0);
                        this.panzoom.zoom(1, {
                            animate: true
                        });
                    } else {
                        this.panzoom.zoomToPoint(this.panzoom.getScale() * Math.exp(this.options.step), e);
                    }
                });
        },

        disableDblClick: function (milliseconds) {
            this.disabledDblClick = true;
            setTimeout(() => {
                this.disabledDblClick = false;
            }, milliseconds);
        },

        disable: function () {
            this.panzoom.setOptions({
                disablePan: true,
                disableZoom: true,
                touchAction: ''
            });
        },

        enable: function () {
            this.panzoom.setOptions({
                disablePan: true, // will enable after first zoom
                disableZoom: false,
                touchAction: 'none'
            });
        },

        reset: function () {
            this.panzoom.reset({
                animate: false
            });
        }
    });

    function panzoom(gallery) {
        var el = gallery.element.find('.main-image-wrapper'),
            instance = el.panzoom('instance');

        if (!instance) {
            el.panzoom();
            instance = el.panzoom('instance');
        }

        return instance;
    }

    $(document)
        .on('gallery:beforeCreate', (e, data) => {
            panzoom(data.instance);
        })
        .on('gallery:beforeActivate', (e, data) => {
            panzoom(data.instance).reset();
        })
        .on('gallery:afterActivate', (e, data) => {
            if (!data.instance.opened()) {
                return;
            }

            if (data.instance.stage.hasClass('video')) {
                panzoom(data.instance).disable();
            } else {
                panzoom(data.instance).enable();
            }
        })
        .on('gallery:beforeOpen', (e, data) => {
            panzoom(data.instance).enable();
            panzoom(data.instance).reset();
            panzoom(data.instance).disableDblClick(300);
        })
        .on('gallery:beforeClose', (e, data) => {
            panzoom(data.instance).disable();
            panzoom(data.instance).reset();
        });
})();
