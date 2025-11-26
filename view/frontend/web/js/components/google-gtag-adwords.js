/* global gtag dataLayer */
(function () {
    'use strict';

    $.breezemap['Magento_GoogleGtag/js/google-adwords'] = function (config) {
        var gtagScript;

        if (!window.gtag) {
            gtagScript = document.createElement('script');
            gtagScript.type = 'text/javascript';
            gtagScript.async = true;
            gtagScript.src = config.gtagSiteSrc;
            document.head.appendChild(gtagScript);

            window.dataLayer = window.dataLayer || [];

            // eslint-disable-next-line no-inner-declarations
            function gtag() { dataLayer.push(arguments); }

            gtag('js', new Date());
            gtag('set', 'developer_id.dYjhlMD', true);
            if (config.conversionLabel) {
                gtag(
                    'event',
                    'conversion',
                    {'send_to': config.conversionId + '/'
                            + config.conversionLabel}
                );
            }
        } else {
            gtag('config', config.conversionId);
        }
    };
}());
