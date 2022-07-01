(function () {
    'use strict';

    var panzoom, disableDblClick;

    function create(widget) {
        var options = {
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
            el = widget.element.find('.main-image-wrapper').get(0);

        panzoom = Panzoom(el, options);

        el.addEventListener('panzoomzoom', (e) => {
            if (e.detail.scale === 1) {
                if (e.detail.x !== 0 || e.detail.y !== 0) {
                    panzoom.pan(0, 0);
                }
            }

            panzoom.setOptions({
                disablePan: e.detail.scale === 1
            });
        });

        el.addEventListener('wheel', (e) => {
            if (!$(e.currentTarget).is('.opened .stage:not(.video) .main-image-wrapper')) {
                return;
            }

            panzoom.zoomWithWheel(e);
        }, {
            passive: true
        });

        widget.element
            .on('swiped-left swiped-right', (e) => {
                if (panzoom.getScale() > 1) {
                    e.stopImmediatePropagation(); // prevent next/prev
                }
            })
            .on('click', '.zoom', (e) => {
                e.preventDefault();
                panzoom[$(e.currentTarget).hasClass('zoom-out') ? 'zoomOut' : 'zoomIn']();
            })
            .on('dblclick dbltap', '.main-image-wrapper', (e) => {
                if (disableDblClick) {
                    return;
                }

                if (panzoom.getScale() >= options.maxScale) {
                    panzoom.pan(0, 0);
                    panzoom.zoom(1, {
                        animate: true
                    });
                } else {
                    panzoom.zoomToPoint(panzoom.getScale() * Math.exp(options.step), e);
                }
            });
    }

    function disable() {
        panzoom.setOptions({
            disablePan: true,
            disableZoom: true,
            touchAction: ''
        });
    }

    function enable() {
        panzoom.setOptions({
            disablePan: true, // will enable after first zoom
            disableZoom: false,
            touchAction: 'none'
        });
    }

    function reset() {
        panzoom.reset({
            animate: false
        });
    }

    $(document)
        .on('gallery:beforeCreate', (e, data) => {
            create(data.instance);
        })
        .on('gallery:beforeActivate', reset)
        .on('gallery:afterActivate', (e, data) => {
            if (!data.instance.opened()) {
                return;
            }

            if (data.instance.stage.hasClass('video')) {
                disable();
            } else {
                enable();
            }
        })
        .on('gallery:beforeOpen', () => {
            enable();
            reset();

            disableDblClick = true;
            setTimeout(() => {
                disableDblClick = false;
            }, 300);
        })
        .on('gallery:beforeClose', () => {
            disable();
            reset();
        });
})();
