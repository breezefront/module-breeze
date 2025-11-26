(function () {
    'use strict';

    $.widget('cookieNotices', {
        lumapath: 'Magento_Cookie/js/notices', // allows using Luma-based mixins
        component: 'cookieNotices',

        create: function () {
            var self = this;

            if ($.cookies.get(this.options.cookieName)) {
                this.element.hide();
            } else {
                $.raf(() => this.element.show());
            }

            $(this.options.cookieAllowButtonSelector).on('click', function () {
                var cookieExpires = new Date(new Date().getTime() + self.options.cookieLifetime * 1000);

                $.cookies.set(self.options.cookieName, JSON.stringify(self.options.cookieValue), {
                    expires: cookieExpires
                });

                if ($.cookies.get(self.options.cookieName)) {
                    $(self.element).hide();
                    $(document).trigger('user:allowed:save:cookie');
                } else {
                    $.breeze.visit(self.options.noCookiesUrl);
                }
            });
        }
    });
})();
