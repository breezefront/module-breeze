(function () {
    'use strict';

    $('form[data-auto-submit="true"]').submit();

    $(document).on('submit', function (event) {
        var input,
            form = $(event.target),
            formKey = $('input[name="form_key"]').val();

        if (!formKey ||
            form.attr('method') !== 'post' ||
            form.attr('action').indexOf(window.BASE_URL) !== 0 ||
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
})();
