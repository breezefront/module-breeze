(function () {
    'use strict';

    var config = $('#breeze-turbo').data('config'),
        mergedRe = /\/_cache\/merged\/([a-z0-9]+)/,
        staticRe = /\/static\/version([a-z0-9]+)/,
        mergedVersion = ($('link[href*="/_cache/merged/"]').attr('href') || '').match(mergedRe),
        staticVersion = ($('link[href*="/static/version"]').attr('href') || '').match(staticRe),
        restoreInlineScripts = true;

    function isResourceVersionChanged(type) {
        var regex = type === 'static' ? staticRe : mergedRe,
            oldVersion = type === 'static' ? staticVersion : mergedVersion,
            newVersion = event.data.xhr.responseText.match(regex);

        if (!oldVersion) {
            return !!newVersion;
        }

        return !newVersion || oldVersion[1] !== newVersion[1];
    }

    /**
     * Refresh the page if store was changed or breeze was disabled during visit
     */
    function onBeforeRender(event) {
        var newConfig = $(event.data.newBody).find('#breeze-turbo').data('config'),
            shouldReload;

        shouldReload = !newConfig || config.store !== newConfig.store || !newConfig.enabled;

        if (shouldReload) {
            event.preventDefault();
            window.location.reload();
        }
    }

    /**
     * Restore inline scripts if back/forward buttons where used to open the page
     */
    function onRender() {
        if (restoreInlineScripts) {
            $(document.body).find('script[type="text/breeze"]').each(function () {
                this.parentNode.insertBefore($(this).clone().removeAttr('type').get(0), this);
                $(this).remove();
            });
        }

        restoreInlineScripts = true;
    }

    /**
     * Cancel inline scripts restoring to prevent double calls.
     */
    function onRequestStart() {
        restoreInlineScripts = false;
    }

    /**
     * RequestEnd event is used to minify unstyled blink effect.
     */
    function onRequestEnd(event) {
        if (isResourceVersionChanged('merged') || isResourceVersionChanged('static')) {
            event.preventDefault();
            window.location.reload();
        } else {
            $.registry.delete();
            updateLoadedScripts();
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

        // prevent multiple calls of the same script when page is restored by turbo cache
        $(document.body)
            .find('script:not([type]), script[type="text/javascript"], script[type="module"]')
            .attr('type', 'text/breeze');

        updateLoadedScripts();

        $(document).trigger('breeze:destroy');
    }

    function updateLoadedScripts() {
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

        if (!config.enabled) {
            excluded = true;
        } else {
            excluded = _.some(config.excludedUrls, function (excludedUrl) {
                return url.indexOf(excludedUrl) !== -1;
            });
        }

        if (excluded) {
            event.preventDefault();
            window.location.href = url;
        }
    }

    document.addEventListener('turbolinks:before-render', onBeforeRender);
    document.addEventListener('turbolinks:render', onRender);
    document.addEventListener('turbolinks:request-start', onRequestStart);
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

            if (code >= 200 && code < 300 || code === 403 || code === 404 || code === 500) {
                this.delegate.requestCompletedWithResponse(
                    this.xhr.responseText,
                    this.xhr.getResponseHeader('Turbolinks-Location')
                );
            } else {
                this.failed = true;
                this.delegate.requestFailedWithStatusCode(code, this.xhr.responseText);
            }
        }.bind(this));
    };
})();
