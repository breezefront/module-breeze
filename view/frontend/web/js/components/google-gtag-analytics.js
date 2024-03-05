/* global gtag dataLayer */
(function () {
    'use strict';

    var loaded = false;

    $.widget('googleGtagAnalytics', {
        component: 'Magento_GoogleGtag/js/google-analytics',

        create: function () {
            if (!this.isAllowed()) {
                return;
            }

            this.start();
        },

        isAllowed: function () {
            var cookie;

            if (!this.options.isCookieRestrictionModeEnabled) {
                return true;
            }

            cookie = $.cookies.getJson(this.options.cookieName);

            return cookie && cookie[this.options.currentWebsite] === 1;
        },

        start: function () {
            var measurementId = this.options.pageTrackingData.measurementId,
                purchaseObject;

            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function () { dataLayer.push(arguments); };

            if (!loaded) {
                loaded = true;
                $.lazy(() => $.loadScript('https://www.googletagmanager.com/gtag/js?id=' + measurementId));
                gtag('js', new Date());
            }

            gtag('config', measurementId, { 'anonymize_ip': true });

            if (this.options.ordersTrackingData.hasOwnProperty('currency')) {
                purchaseObject = this.options.ordersTrackingData.orders[0];
                purchaseObject.items = this.options.ordersTrackingData.products;
                gtag('event', 'purchase', purchaseObject);
            }
        }
    });
}());
