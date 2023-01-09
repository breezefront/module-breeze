(function () {
    'use strict';

    $.widget('googleGtagAnalytics', {
        component: 'Magento_GoogleGtag/js/google-analytics',

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
            var measurementId = this.options.pageTrackingData.measurementId;

            if (window.gtag) {
                gtag('config', measurementId, { 'anonymize_ip': true });
                // Purchase Event
                if (this.options.ordersTrackingData.hasOwnProperty('currency')) {
                    var purchaseObject = this.options.ordersTrackingData.orders[0];
                    purchaseObject['items'] = this.options.ordersTrackingData.products;
                    gtag('event', 'purchase', purchaseObject);
                }
            } else {
                (function(d,s,u){
                    var gtagScript = d.createElement(s);
                    gtagScript.type = 'text/javascript';
                    gtagScript.async = true;
                    gtagScript.src = u;
                    d.head.insertBefore(gtagScript, d.head.children[0]);
                })(document, 'script', 'https://www.googletagmanager.com/gtag/js?id=' + measurementId);
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('set', 'developer_id.dYjhlMD', true);
                gtag('config', measurementId, { 'anonymize_ip': true });
                // Purchase Event
                if (this.options.ordersTrackingData.hasOwnProperty('currency')) {
                    var purchaseObject = this.options.ordersTrackingData.orders[0];
                    purchaseObject['items'] = this.options.ordersTrackingData.products;
                    gtag('event', 'purchase', purchaseObject);
                }
            }
        }
    });
}());
