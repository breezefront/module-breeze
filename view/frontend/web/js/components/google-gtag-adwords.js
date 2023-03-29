/* global gtag dataLayer */
(function () {
    'use strict';

    $.widget('googleGtagAdwords', {
        component: 'Magento_GoogleGtag/js/google-adwords',

        create: function () {
            var gtagScript;

            if (!window.gtag) {
                gtagScript = document.createElement('script');
                gtagScript.type = 'text/javascript';
                gtagScript.async = true;
                gtagScript.src = this.options.gtagSiteSrc;
                document.head.appendChild(gtagScript);

                window.dataLayer = window.dataLayer || [];

                // eslint-disable-next-line no-inner-declarations
                function gtag() { dataLayer.push(arguments); }

                gtag('js', new Date());
                gtag('set', 'developer_id.dYjhlMD', true);
                if (this.options.conversionLabel) {
                    gtag(
                        'event',
                        'conversion',
                        {'send_to': this.options.conversionId + '/' + this.options.conversionLabel}
                    );
                }
            } else {
                gtag('config', this.options.conversionId);
            }
        }
    });
}());
