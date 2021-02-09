var loadEventName = 'DOMContentLoaded';

if (typeof Turbo !== 'undefined') {
    loadEventName = 'turbo:load';
}

document.addEventListener(loadEventName, function (event) {
    'use strict';

    document.dispatchEvent(new CustomEvent('breeze:load', {
        detail: event.detail ? event.detail : {
            url: window.location.href
        }
    }));

    document.querySelectorAll('[data-mage-init]').forEach(function (el) {
        var settings = JSON.parse(el.dataset.mageInit);

        Object.entries(settings).forEach(function (config) {
            document.dispatchEvent(new CustomEvent('breeze:mount:' + config[0], {
                detail: {
                    el: el,
                    settings: config[1]
                }
            }));
        });
    });
});

document.addEventListener('turbo:before-cache', function () {
    'use strict';

    window.breeze.widget().destroy();
});
