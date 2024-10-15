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
        if (typeof Turbolinks !== 'undefined') {
            Turbolinks.visit(url);
        } else {
            location.href = url;
        }
    };

    $.breeze.scrollbar = {
        counter: 0,

        hide: function () {
            var padding = parseFloat($('body').css('padding-right')),
                scrollbar = Math.abs(window.innerWidth - document.documentElement.clientWidth);

            this.counter++;

            $('body')
                .css('box-sizing', 'border-box')
                .css('padding-right', padding + scrollbar);

            $('html, body').css('overflow', 'hidden');
        },

        reset: function () {
            if (!this.counter || --this.counter) {
                return;
            }

            $('body')
                .css('box-sizing', '')
                .css('padding-right', '');

            $('html, body').css('overflow', '');
        }
    };
})();
