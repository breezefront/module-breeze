(function () {
    'use strict';

    $(document).on('breeze:load', () => {
        $('form[data-auto-submit="true"]').submit();
    });

    $(document).on('submit', function (event) {
        var input,
            form = $(event.target),
            formKey = $('input[name="form_key"]').val();

        if (!formKey ||
            form.prop('method') !== 'post' ||
            form.prop('action').indexOf(window.BASE_URL) !== 0 ||
            form.children('input[name="form_key"]').length
        ) {
            return;
        }

        input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', 'form_key');
        input.setAttribute('value', formKey);
        input.setAttribute('auto-added-form-key', '1');
        form.get(0).appendChild(input);
    });

    $.breeze.getScopeId = function (scope) {
        var mapping = {
            'store': window.checkout ? window.checkout.storeId : '',
            'group': window.checkout ? window.checkout.storeGroupId : '',
            'website': window.checkout ? window.checkout.websiteId : ''
        };

        if (!mapping[scope]) {
            scope = 'website';
        }

        return mapping[scope];
    };

    $.breeze.visit = function (url) {
        location.href = url;
    };

    $.breeze.scrollbar = {
        counter: 0,
        scrollTop: 0,

        hide: function () {
            var padding = parseFloat($('body').css('padding-right')),
                scrollbar = Math.abs(window.innerWidth - document.documentElement.clientWidth);

            if (++this.counter > 1) {
                return;
            }

            this.scrollTop = window.pageYOffset;

            $('body').css({
                'box-sizing': 'border-box',
                'padding-right': $('html').css('scrollbar-gutter') === 'stable' ? '' : padding + scrollbar,
                'overflow': 'hidden',
                'position': 'fixed',
                'width': '100%',
                'top': `-${this.scrollTop}px`,
            });
        },

        reset: function () {
            if (!this.counter || --this.counter) {
                return;
            }

            $('body').css({
                'box-sizing': '',
                'padding-right': '',
                'overflow': '',
                'position': '',
                'width': '',
                'top': '',
            });

            window.scrollTo(0, this.scrollTop);
        }
    };
})();
