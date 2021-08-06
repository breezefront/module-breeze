/* global _ */
(function () {
    'use strict';

    var config = $('#breeze-turbo').data('config');

    /** Get correctly prefixed event name for turbo library */
    function turboEventName(name) {
        var prefix = 'turbo:';

        if (typeof Turbolinks !== 'undefined') {
            prefix = 'turbolinks:';
        }

        return prefix + name;
    }

    // refresh the page if store was changed or breeze was disabled during visit
    document.addEventListener(turboEventName('before-render'), function (event) {
        var newConfig = $(event.data.newBody).find('#breeze-turbo').data('config');

        if (!newConfig || config.store !== newConfig.store) {
            event.preventDefault();
            window.location.reload();
        }
    });

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

    // disable turbo for certain urls before trying to load then
    document.addEventListener(turboEventName('before-visit'), function (event) {
        var url = event.data.url,
            excluded = false;

        excluded = _.some(config.excludedUrls, function (excludedUrl) {
            return url.indexOf(excludedUrl) !== -1;
        });

        if (excluded) {
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
