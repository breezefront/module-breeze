/* global gtag dataLayer */
(function () {
    'use strict';

    $.breezemap['Magento_GoogleGtag/js/google-analytics'] = function (config) {
        var allowedWebsites,
            measurementId = config.pageTrackingData.measurementId,
            purchaseObject;

        if (config.isCookieRestrictionModeEnabled) {
            allowedWebsites = $.cookies.getJson(config.cookieName);
            if (allowedWebsites?.[config.currentWebsite] !== 1) {
                return;
            }
        }

        if (!window.gtag) {
            $.lazy(() => $.loadScript('https://www.googletagmanager.com/gtag/js?id=' + measurementId));
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { dataLayer.push(arguments); };
            gtag('js', new Date());
        }

        gtag('config', measurementId, { 'anonymize_ip': true });

        if (config.ordersTrackingData.hasOwnProperty('orders')) {
            purchaseObject = config.ordersTrackingData.orders[0];
            purchaseObject['items'] = config.ordersTrackingData.products;
            gtag('event', 'purchase', purchaseObject);
        }
    };
}());
