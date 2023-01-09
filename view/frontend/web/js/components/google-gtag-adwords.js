(function () {
    'use strict';

    $.widget('googleGtagAdwords', {
        component: 'Magento_GoogleGtag/js/google-adwords',

        /** [create description] */
        create: function () {
            if (!window.gtag) {
                // Inject Global Site Tag
                var gtagScript = document.createElement('script');
                gtagScript.type = 'text/javascript';
                gtagScript.async = true;
                gtagScript.src = this.options.gtagSiteSrc;
                document.head.appendChild(gtagScript);

                window.dataLayer = window.dataLayer || [];

                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('set', 'developer_id.dYjhlMD', true);
                if (this.options.conversionLabel) {
                    gtag(
                        'event',
                        'conversion',
                        {'send_to': this.options.conversionId + '/'
                                + this.options.conversionLabel}
                    );
                }
            } else {
                gtag('config', this.options.conversionId);
            }
        }
    });
}());
