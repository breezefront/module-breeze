/* global gtag dataLayer */
(function () {
    'use strict';

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

            if (!window.gtag) {
                $.lazy(() => $.loadScript('https://www.googletagmanager.com/gtag/js?id=' + measurementId));
                window.dataLayer = window.dataLayer || [];

                // eslint-disable-next-line no-inner-declarations
                function gtag() { dataLayer.push(arguments); }

                gtag('js', new Date());
                gtag('set', 'developer_id.dYjhlMD', true);
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
