/* global breeze customerData $t */
(function () {
    'use strict';

    breeze.widget('persistent', {
        /** Initialize plugin */
        create: function () {
            var persistent = customerData.get('persistent');

            if (persistent().fullname === undefined) {
                customerData.get('persistent').subscribe(this.replacePersistentWelcome);
            } else {
                this.replacePersistentWelcome();
            }
        },

        /** Replace welcome message for customer with persistent cookie. */
        replacePersistentWelcome: function () {
            var persistent = customerData.get('persistent'),
                welcomeElems;

            if (persistent().fullname !== undefined) {
                welcomeElems = $('li.greet.welcome > span.not-logged-in');

                if (welcomeElems.length) {
                    $(welcomeElems).each(function () {
                        var html = $t('Welcome, %1!').replace('%1', persistent().fullname);

                        $(this).attr('data-bind', html);
                        $(this).html(html);
                    });
                    $(welcomeElems).append(' <span><a ' + window.notYouLink + '>' + $t('Not you?') + '</a>');
                }
            }
        }
    });

    $(document).on('breeze:mount:Magento_Persistent/js/view/additional-welcome', function (event, data) {
        $(data.el).persistent(data.settings);
    });
})();
