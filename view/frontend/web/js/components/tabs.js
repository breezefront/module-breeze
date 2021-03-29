/* global breeze */
(function () {
    'use strict';

    breeze.widget('tabs', function (settings) {
        var options = $.extend({
                active: 0,
                collapsible: false,
                collapsibleElement: '[data-role=collapsible]',
                header: '[data-role=title]',
                content: '[data-role=content]',
                trigger: '[data-role=trigger]'
            }, settings),
            element = this,
            collapsibles = $(element).find(options.collapsibleElement),
            headers = $(element).find(options.header),
            triggers = $(element).find(options.trigger),
            contents = $(element).find(options.content);

        if (headers.length === 0) {
            headers = collapsibles;
        }

        if (triggers.length === 0) {
            triggers = headers;
        }

        collapsibles
            .attr('role', 'presentation')
            .parent()
            .attr('role', 'tablist');

        collapsibles.each(function (index, el) {
            $(el).collapsible($.extend({}, options, {
                active: index === options.active,
                header: headers.eq(index),
                content: contents.eq(index),
                trigger: triggers.eq(index)
            }));

            $(el).on('beforeOpen', function () {
                collapsibles.not(el).collapsible('close');
            });
        });
    });

    $(document).on('breeze:mount:tabs', function (event) {
        $(event.detail.el).tabs(event.detail.settings);
    });
})();
