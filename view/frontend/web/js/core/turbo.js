(function () {
    'use strict';

    /** Get correctly prefixed event name for turbo library */
    function turboEventName(name) {
        var prefix = 'turbo:';

        if (typeof Turbolinks !== 'undefined') {
            prefix = 'turbolinks:';
        }

        return prefix + name;
    }

    $(document).on(turboEventName('before-cache'), function () {
        // destroy all widgets and views
        window.breeze.registry.delete();

        $(document)
            .find('[data-breeze-temporary]')
            .remove();

        $(document)
            .find('[data-breeze-processed]')
            .removeAttr('data-breeze-processed');
    });

    // disable turbo for certain urls
    document.addEventListener(turboEventName('before-visit'), function (event) {
        var url = event.data.url;

        if (url.indexOf('/redirect/') !== -1) {
            event.preventDefault();
            window.location.href = url;
        }
    });

    // Fix for document.referrer when using turbo.
    // Since it's readonly - use breeze.referrer instead.
    (function () {
        var referrers = {};

        window.breeze.referrer = $.storage.ns('breeze').get('referrer') || document.referrer;

        // Since this event doesn't work when using back/forward buttons we use it to update referrers
        // $.on is not used because it's overwrite event.data property
        document.addEventListener(turboEventName('before-visit'), function (event) {
            referrers[event.data.url] = window.location.href;
        });

        $(document).on(turboEventName('visit'), function () {
            window.breeze.referrer = referrers[window.location.href] || document.referrer;
            $.storage.ns('breeze').set('referrer', window.breeze.referrer);
        });
    })();
})();
