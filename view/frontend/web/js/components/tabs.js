/* global breeze */
(function () {
    'use strict';

    breeze.widget('tabs', {
        options: {
            active: 0,
            collapsible: false,
            collapsibleElement: '[data-role=collapsible]',
            header: '[data-role=title]',
            content: '[data-role=content]',
            trigger: '[data-role=trigger]'
        },

        /** init widget */
        create: function () {
            var self = this,
                activeIndex;

            this.collapsibles = this.element.find(this.options.collapsibleElement);
            this.headers = this.element.find(this.options.header);
            this.triggers = this.element.find(this.options.trigger);
            this.contents = this.element.find(this.options.content);

            if (this.headers.length === 0) {
                this.headers = this.collapsibles;
            }

            if (this.triggers.length === 0) {
                this.triggers = this.headers;
            }

            this.collapsibles
                .attr('role', 'presentation')
                .parent()
                .attr('role', 'tablist');

            this.triggers.attr('role', 'tab');

            activeIndex = this.findActiveTabIndex(location.hash);

            if (activeIndex > -1) {
                this.options.active = activeIndex;
            }

            this.collapsibles.each(function (index, el) {
                $(el).collapsible($.extend({}, self.options, {
                    active: index === self.options.active,
                    header: self.headers.eq(index),
                    content: self.contents.eq(index),
                    trigger: self.triggers.eq(index)
                }));

                $(el).on('beforeOpen', function () {
                    self.collapsibles.not(el).collapsible('close');
                });
            });

            // Reviews and other third-party links
            $(document).on('click', 'a[href*="#"]', function () {
                var anchor = $(this).attr('href').split('#')[1],
                    index;

                if (!anchor || self.element.has(this).length) {
                    return;
                }

                index = self.findActiveTabIndex('#' + anchor);

                if (index === -1) {
                    return;
                }

                self.collapsibles.eq(index).collapsible('open');
                self.triggers.eq(index).get(0).scrollIntoView();
            });
        },

        /** Find active tab index */
        findActiveTabIndex: function (hash) {
            var index = -1,
                activeTrigger,
                activeContent;

            if (!hash) {
                return -1;
            }

            activeTrigger = this.triggers.has('[href*="' + hash + '"');

            if (activeTrigger.length) {
                index = this.triggers.index(activeTrigger);
            } else {
                activeContent = this.contents.has(hash);

                if (activeContent.length) {
                    index = this.contents.index(activeContent);
                }
            }

            return index;
        }
    });

    $(document).on('breeze:mount:tabs', function (event) {
        $(event.detail.el).tabs(event.detail.settings);
    });
})();
