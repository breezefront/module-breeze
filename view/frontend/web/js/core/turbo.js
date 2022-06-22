/* global _ */
(function () {
    'use strict';

    var config = $('#breeze-turbo').data('config'),
        mergedCss = $('link[href*="/merged/"]')[0];

    /**
     * Refresh the page if store was changed or breeze was disabled during visit
     */
    function onBeforeRender(event) {
        var newConfig = $(event.data.newBody).find('#breeze-turbo').data('config'),
            shouldReload;

        shouldReload = !newConfig || config.store !== newConfig.store;

        if (shouldReload) {
            event.preventDefault();
            window.location.reload();
        }
    }

    /**
     * Refresh the page if main merged css was changed
     */
    function onRequestEnd(event) {
        var hashRegex = /\/_cache\/merged\/([a-z0-9]+)/,
            newMergedCss = event.data.xhr.responseText.match(hashRegex),
            oldMergedCss,
            shouldReload;

        if (!mergedCss) {
            return;
        }

        oldMergedCss = mergedCss.href.match(hashRegex);
        shouldReload = !newMergedCss || oldMergedCss[1] !== newMergedCss[1];

        if (shouldReload) {
            event.preventDefault();
            window.location.reload();
        }
    }

    function onBeforeCache() {
        // destroy all widgets and views
        $.registry.delete();

        $(document)
            .find('[data-breeze-temporary]')
            .remove();

        $(document)
            .find('[data-breeze-processed]')
            .removeAttr('data-breeze-processed');

        $('script[src]').each(function () {
            $.breeze.loadedScripts[this.src] = true;
        });
    }

    /**
     * Disable turbo for certain urls before trying to load them
     */
    function onBeforeVisit(event) {
        var url = event.data.url,
            excluded = false;

        excluded = _.some(config.excludedUrls, function (excludedUrl) {
            return url.indexOf(excludedUrl) !== -1;
        });

        if (excluded) {
            event.preventDefault();
            window.location.href = url;
        }
    }

    document.addEventListener('turbolinks:before-render', onBeforeRender);
    document.addEventListener('turbolinks:request-end', onRequestEnd);
    document.addEventListener('turbolinks:before-cache', onBeforeCache);
    document.addEventListener('turbolinks:before-visit', onBeforeVisit);

    // Fix for document.referrer when using turbo.
    // Since it's readonly - use $.breeze.referrer instead.
    (function () {
        var referrers = {};

        $.breeze.referrer = $.storage.ns('breeze').get('referrer') || document.referrer;

        // Since this event doesn't work when using back/forward buttons we use it to update referrers
        // $.on is not used because it's overwrite event.data property
        document.addEventListener('turbolinks:before-visit', function (event) {
            referrers[event.data.url] = window.location.href;
        });

        $(document).on('turbolinks:visit', function () {
            $.breeze.referrer = referrers[window.location.href] || document.referrer;
            $.storage.ns('breeze').set('referrer', $.breeze.referrer);
        });
    })();

    // Fixed jumping content on 404 page. Taken from https://github.com/turbolinks/turbolinks/issues/179
    Turbolinks.HttpRequest.prototype.requestLoaded = function () {
        return this.endRequest(function () {
            var code = this.xhr.status;

            if (200 <= code && code < 300 || code === 403 || code === 404 || code === 500) {
                this.delegate.requestCompletedWithResponse(
                    this.xhr.responseText,
                    this.xhr.getResponseHeader("Turbolinks-Location")
                );
            } else {
                this.failed = true;
                this.delegate.requestFailedWithStatusCode(code, this.xhr.responseText);
            }
        }.bind(this));
    };
})();
