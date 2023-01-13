(function () {
    'use strict';

    $.breezemap['mage/template'] = function (tmpl, data) {
        try {
            tmpl = document.querySelector(tmpl)?.innerHTML.trim();
        } catch (e) {}

        tmpl = tmpl.replace(/&lt;%|%3C%/g, '<%').replace(/%&gt;|%%3E/g, '%>');

        return _.isUndefined(data) ? _.template(tmpl) : _.template(tmpl)(data);
    };
}());
