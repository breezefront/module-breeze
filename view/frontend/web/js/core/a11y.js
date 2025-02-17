define(['mage/template'], (template) => {
    'use strict';

    // disable tab navigation, switch focus to the first not disabled element
    $(document).on('focusin.a11y', '[data-a11y-selectable]', async (e) => {
        var scope = $(e.target).closest('[data-a11y-selectable]'),
            selector = scope.attr('data-a11y-selectable'),
            [{focusable}] = await require.async(['tabbable']),
            focusableElements = $(focusable(scope[0])).filter(selector || (() => true)),
            tabbableElements = focusableElements.not('.disabled'),
            index = tabbableElements.index(e.target);

        if (selector && !$(e.target).is(selector)) {
            return;
        }

        focusableElements.attr('tabindex', -1);
        tabbableElements.eq(Math.max(index, 0)).attr('tabindex', 0).get(0).focus();
    });

    $(document).on('keydown.a11y', '[data-a11y-selectable]', async (e, data) => {
        var scope = $(e.target).closest('[data-a11y-selectable]'),
            selector = scope.attr('data-a11y-selectable'),
            [{focusable}] = await require.async(['tabbable']),
            focusableElements = $(focusable(scope[0])).filter(selector || (() => true)),
            tabbableElements = focusableElements.not('.disabled'),
            index = tabbableElements.index(e.target),
            keys = scope.attr('data-a11y-selectable-keys');

        if (selector && !$(e.target).is(selector)) {
            return;
        }

        if (keys) {
            keys = JSON.parse(keys);
            if (keys[e.key || data.key] === false) {
                return;
            }
        }

        switch (e.key || data.key) {
            case 'ArrowDown':
                index++;
                break;
            case 'ArrowUp':
                index--;
                break;
            case 'ArrowRight':
                index += $('body').hasClass('rtl') ? -1 : 1;
                break;
            case 'ArrowLeft':
                index += $('body').hasClass('rtl') ? 1 : -1;
                break;
            case 'Home':
                index = 0;
                break;
            case 'End':
                index = -1;
                break;
            default:
                return;
        }

        if (index < 0) {
            index = tabbableElements.length - 1;
        } else if (index >= tabbableElements.length) {
            index = 0;
        }

        e.preventDefault();
        focusableElements.attr('tabindex', -1);
        tabbableElements.eq(index).attr('tabindex', 0).focus().trigger('a11y:focus');
    });

    $(document).on('keydown.a11y', (e) => {
        if (e.key === 'Escape') {
            $.breeze.a11y.openable.close($('[data-a11y-openable]:has([aria-expanded="true"])'));
        }
    });

    $(document).on('keydown.a11y', '[data-a11y-openable]', (e, data) => {
        var scope = $(e.target).closest('[data-a11y-openable]'),
            isOpened = scope.find('[aria-expanded="true"]').length > 0,
            method;

        switch (e.key || data.key) {
            case ' ':
            case 'Enter':
                if (scope.find('[aria-hidden]').has(e.target).length) {
                    return;
                }
                method = isOpened ? 'close' : 'open';
                break;

            // case 'ArrowUp':
            // case 'ArrowDown':
            //     method = 'open';
            //     break;

            case 'Tab':
                setTimeout(() => {
                    if (!scope.find('[aria-hidden]').has(document.activeElement).length) {
                        $.breeze.a11y.openable.close(scope);
                    }
                }, 1);
                return;

            default:
                return;
        }

        e.preventDefault();
        $.breeze.a11y.openable[method](scope);
    });

    $.breeze.a11y = {
        // navigate over elements using arrows. tabindexes removed.
        selectable: {
            init: function (scope, options) {
                scope.attr('data-a11y-selectable', options?.selectable || '');

                if (options?.keys) {
                    scope.attr('data-a11y-selectable-keys', JSON.stringify(options.keys));
                }
            },
        },

        // open/close on Enter, Space, and Escape.
        openable: {
            init: function (scope) {
                scope.attr('data-a11y-openable', '');
            },
            open: (target) => $(target).trigger('a11y:open'),
            close: (target) => $(target).trigger('a11y:close'),
        },

        skippable: {
            init: function (scope, options) {
                var skipTpl = '<a href="#<%- id %>" class="action skip" data-breeze-temporary><%- label %></a>',
                    anchorTpl = '<span id="<%- id %>" class="anchor skip" data-breeze-temporary></span>',
                    destination = scope,
                    method = 'after';

                scope.prepend(template(skipTpl, options));

                if (options.destination) {
                    destination = options.destination;
                    method = 'prepend';
                }

                $(destination)[method](template(anchorTpl, options));
            }
        }
    };

    return $.breeze.a11y;
});
