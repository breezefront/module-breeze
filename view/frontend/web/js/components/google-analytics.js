/* global ga */
(function () {
    'use strict';

    $.breezemap['Magento_GoogleAnalytics/js/google-analytics'] = function (config) {
        var allowedWebsites;

        if (config.isCookieRestrictionModeEnabled) {
            allowedWebsites = $.cookies.getJson(config.cookieName);
            if (allowedWebsites?.[config.currentWebsite] !== 1) {
                return;
            }
        }

        (function (i, s, o, g, r, a, m) {
            i.GoogleAnalyticsObject = r;
            i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments);
                }, i[r].l = 1 * new Date();
            a = s.createElement(o),
                m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            $.lazy(() => m.parentNode.insertBefore(a, m));
        })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

        // Process page info
        ga('create', config.pageTrackingData.accountId, 'auto');

        if (config.pageTrackingData.isAnonymizedIpActive) {
            ga('set', 'anonymizeIp', true);
        }

        // Process orders data
        if (config.ordersTrackingData.hasOwnProperty('currency')) {
            ga('require', 'ec', 'ec.js');

            ga('set', 'currencyCode', config.ordersTrackingData.currency);

            // Collect product data for GA
            if (config.ordersTrackingData.products) {
                $.each(config.ordersTrackingData.products, function (index, value) {
                    ga('ec:addProduct', value);
                });
            }

            // Collect orders data for GA
            if (config.ordersTrackingData.orders) {
                $.each(config.ordersTrackingData.orders, function (index, value) {
                    ga('ec:setAction', 'purchase', value);
                });
            }

            ga('send', 'pageview');
        } else {
            // Process Data if not orders
            ga('send', 'pageview' + config.pageTrackingData.optPageUrl);
        }
    };
})();
