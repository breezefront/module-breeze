(() => {
    'use strict';

    function focusTrapFacade(element, options) {
        var trap;

        function load() {
            return new Promise(resolve => {
                if (trap) {
                    return resolve(trap);
                }

                require(['focus-trap'], () => {
                    trap = window.focusTrap.createFocusTrap(element, options);
                    resolve(trap);
                });
            });
        }

        return {
            async activate() {
                return (await load()).activate();
            },

            async deactivate() {
                return trap?.deactivate();
            }
        };
    }

    $.focusTrap = {};
    $.focusTrap.createFocusTrap = function (element, options) {
        return new focusTrapFacade(element, $.extend({
            allowOutsideClick: true,
            escapeDeactivates: false
        }, options || {}));
    };

    $.fn.focusTrap = function (flag, options) {
        if (!this.data('__focusTrap')) {
            this.data('__focusTrap', $.focusTrap.createFocusTrap(this[0], options));
        }
        this.data('__focusTrap')[flag ? 'activate' : 'deactivate']();
        return this;
    };
})();
