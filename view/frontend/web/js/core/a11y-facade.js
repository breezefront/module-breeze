define([
    'jquery'
], function ($) {
    'use strict';

    $.fn.a11y = function (fnName, options) {
        $.lazy(() => {
            require(['Swissup_Breeze/js/core/a11y'], a11y => {
                // eslint-disable-next-line max-nested-callbacks
                this.each(function () {
                    a11y[fnName].init($(this), options);
                });
            });
        });
    };
});
