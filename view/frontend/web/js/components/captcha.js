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

        _create: function () {
            this.element.on('click', this.options.reloadSelector, this.refresh.bind(this));
        },

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

                success: function (data) {
                    if (data.imgSrc) {
                        self.element.find(self.options.imageSelector).attr('src', data.imgSrc);
                    }
                },

                complete: function () {
                    button.spinner(false);
                    button.find('span').css('opacity', 1);
                    self.element.removeClass(self.options.refreshClass);
                }
            });
        }
    });
})();
