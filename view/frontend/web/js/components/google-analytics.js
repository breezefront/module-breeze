/* global ga */
(function () {
    'use strict';

    $.widget('googleAnalytics', {
        component: 'Magento_GoogleAnalytics/js/google-analytics',

        /** [create description] */
        create: function () {
            if (!this.isAllowed()) {
                return;
            }

            this.start();
        },

        /** [isAllowed description] */
        isAllowed: function () {
            var cookie;

            if (!this.options.isCookieRestrictionModeEnabled) {
                return true;
            }

            cookie = $.cookies.getJson(this.options.cookieName);

            return cookie && cookie[this.options.currentWebsite] === 1;
        },

        /** [start description] */
        start: function () {
            (function (i, s, o, g, r, a, m) {
                i.GoogleAnalyticsObject = r;
                i[r] = i[r] || function () {
                        (i[r].q = i[r].q || []).push(arguments);
                    }, i[r].l = 1 * new Date();
                a = s.createElement(o),
                    m = s.getElementsByTagName(o)[0];
                a.async = 1;
                a.src = g;
                m.parentNode.insertBefore(a, m);
            })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

            // Process page info
            ga('create', this.options.pageTrackingData.accountId, 'auto');

            if (this.options.pageTrackingData.isAnonymizedIpActive) {
                ga('set', 'anonymizeIp', true);
            }

            // Process orders data
            if (this.options.ordersTrackingData.hasOwnProperty('currency')) {
                ga('require', 'ec', 'ec.js');

                ga('set', 'currencyCode', this.options.ordersTrackingData.currency);

                // Collect product data for GA
                if (this.options.ordersTrackingData.products) {
                    $.each(this.options.ordersTrackingData.products, function (index, value) {
                        ga('ec:addProduct', value);
                    });
                }

                // Collect orders data for GA
                if (this.options.ordersTrackingData.orders) {
                    $.each(this.options.ordersTrackingData.orders, function (index, value) {
                        ga('ec:setAction', 'purchase', value);
                    });
                }

                ga('send', 'pageview');
            } else {
                // Process Data if not orders
                ga('send', 'pageview' + this.options.pageTrackingData.optPageUrl);
            }
        }
    });
})();
