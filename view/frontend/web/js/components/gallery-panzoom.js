(function () {
    'use strict';

    var panzoom, disableDblClick;

    function createPanzoom(widget) {
        panzoom = Panzoom(widget.element.find('.main-image-wrapper').get(0), {
            maxScale: 4,
            contain: 'outside',
            cursor: false,
            step: .5
        });

        widget.element
            .on('click', '.zoom', (e) => {
                e.preventDefault();
                panzoom[$(e.currentTarget).hasClass('zoom-out') ? 'zoomOut' : 'zoomIn']();
            })
            .on('dblclick', '.main-image-wrapper', () => {
                if (disableDblClick) {
                    return;
                }

                if (panzoom.getScale() >= 4) {
                    panzoom.zoom(1, {
                        animate: true
                    });
                } else {
                    panzoom.zoomIn();
                }
            });
    }

    function resetPanzoom() {
        setTimeout(() => {
            panzoom.reset({
                animate: false
            });
        }, 10)
    }

    $(document)
        .on('gallery:beforeCreate', (e, data) => {
            createPanzoom(data.instance);
        })
        .on('gallery:beforeActivate', resetPanzoom)
        .on('gallery:beforeClose', resetPanzoom)
        .on('gallery:beforeOpen', () => {
            resetPanzoom();
            disableDblClick = true;
            setTimeout(() => {
                disableDblClick = false;
            }, 300);
        });
})();
