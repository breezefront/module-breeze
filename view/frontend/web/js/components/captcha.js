(function () {
    'use strict';

    $.widget('captcha', {
        component: 'captcha',
        options: {
            refreshClass: 'refreshing',
            reloadSelector: '.captcha-reload',
            imageSelector: '.captcha-img',
            imageLoader: ''
        },

        /**
         * Method binds click event to reload image
         */
        _create: function () {
            this.element.on('click', this.options.reloadSelector, this.refresh.bind(this));
        },

        /**
         * Method triggers an AJAX request to refresh the CAPTCHA image
         */
        refresh: function () {
            var self = this,
                button = this.element.find(this.options.reloadSelector);

            button.spinner(true, {
                css: {
                    width: 20,
                    height: 20,
                    background: 'none'
                }
            });
            button.find('span').css('opacity', 0);
            this.element.addClass(this.options.refreshClass);

            $.request.post({
                url: this.options.url,
                data: {
                    formId: this.options.type
                },

                /**
                 * @param {Object} data
                 */
                success: function (data) {
                    if (data.imgSrc) {
                        self.element.find(self.options.imageSelector).attr('src', data.imgSrc);
                    }
                },

                /** Complete callback. */
                complete: function () {
                    button.spinner(false);
                    button.find('span').css('opacity', 1);
                    self.element.removeClass(self.options.refreshClass);
                }
            });
        }
    });
})();
