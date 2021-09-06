/* global _ */
(function () {
    'use strict';

    var config = $('#breeze-turbo').data('config'),
        mergedCss = $('link[href*="/merged/"]')[0];

    /** Get correctly prefixed event name for turbo library */
    function turboEventName(name) {
        var prefix = 'turbo:';

        if (typeof Turbolinks !== 'undefined') {
            prefix = 'turbolinks:';
        }

        return prefix + name;
    }

    // fixed not working scripts on 404 page
    document.addEventListener(turboEventName('request-end'), function (event) {
        if (event.data.xhr.status !== 200) {
            event.preventDefault();
            window.location.reload();
        }
    });

    // refresh the page if store was changed or breeze was disabled during visit
    // or main merged css was changed
    document.addEventListener(turboEventName('before-render'), function (event) {
        var newConfig = $(event.data.newBody).find('#breeze-turbo').data('config'),
            newMergedCss = $(event.data.newBody).find('link[href*="/merged/"]')[0],
            shouldReload;

        shouldReload = !newConfig || config.store !== newConfig.store;

        if (!shouldReload) {
            shouldReload = mergedCss && (!newMergedCss || mergedCss.href !== newMergedCss.href);
        }

        if (shouldReload) {
            event.preventDefault();
            window.location.reload();
        }
    });

    $(document).on(turboEventName('before-cache'), function () {
        // destroy all widgets and views
        $.breeze.registry.delete();

        $(document)
            .find('[data-breeze-temporary]')
            .remove();

        $(document)
            .find('[data-breeze-processed]')
            .removeAttr('data-breeze-processed');
    });

    // disable turbo for certain urls before trying to load them
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
    // Since it's readonly - use $.breeze.referrer instead.
    (function () {
        var referrers = {};

        $.breeze.referrer = $.storage.ns('breeze').get('referrer') || document.referrer;

        // Since this event doesn't work when using back/forward buttons we use it to update referrers
        // $.on is not used because it's overwrite event.data property
        document.addEventListener(turboEventName('before-visit'), function (event) {
            referrers[event.data.url] = window.location.href;
        });

        $(document).on(turboEventName('visit'), function () {
            $.breeze.referrer = referrers[window.location.href] || document.referrer;
            $.storage.ns('breeze').set('referrer', $.breeze.referrer);
        });
    })();
})();
