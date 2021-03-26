/* global breeze */
(function () {
    'use strict';

    breeze.widget('cookieNotices', {
        /** Initialize plugin */
        create: function () {
            var self = this;

            if (breeze.cookies.get(this.options.cookieName)) {
                this.element.hide();
            } else {
                this.element.show();
            }

            $(this.options.cookieAllowButtonSelector).on('click', function () {
                var cookieExpires = new Date(new Date().getTime() + self.options.cookieLifetime * 1000);

                breeze.cookies.set(self.options.cookieName, JSON.stringify(self.options.cookieValue), {
                    expires: cookieExpires
                });

                if (breeze.cookies.get(self.options.cookieName)) {
                    $(self.element).hide();
                    $(document).trigger('user:allowed:save:cookie');
                } else {
                    window.location.href = self.options.noCookiesUrl;
                }
            });
        }
    });

    document.addEventListener('breeze:mount:cookieNotices', function (event) {
        $(event.detail.el).cookieNotices(event.detail.settings);
    });
})();
