define(['collapsible'], () => {
    'use strict';

    $.widget('tabs', {
        component: 'tabs',
        options: {
            active: 0,
            collapsible: false,
            collapsibleElement: '[data-role=collapsible]',
            header: '[data-role=title]',
            content: '[data-role=content]',
            trigger: '[data-role=trigger]'
        },

        create: function () {
            var self = this,
                activeIndex,
                allExpanded = true;

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
            this.triggers.last().addClass('last');

            activeIndex = this.findActiveTabIndex(location.hash);

            if (activeIndex > -1) {
                this.options.active = activeIndex;
            }

            this.collapsibles.each(function (index, el) {
                var isActive;

                if (_.isArray(self.options.active)) {
                    isActive = self.options.active.indexOf(index) !== -1;
                } else if (_.isBoolean(self.options.active)) {
                    isActive = self.options.active;
                } else {
                    isActive = index === +self.options.active;
                }

                if (!isActive) {
                    allExpanded = false;
                }

                $(el).collapsible($.extend({}, self.options, {
                    active: isActive,
                    header: self.headers.eq(index),
                    content: self.contents.eq(index),
                    trigger: self.triggers.eq(index)
                }));
            });

            if (allExpanded && this.component === 'tabs') {
                this.triggers.attr('tabIndex', -1);
                this.collapsibles.removeAttr('data-collapsible', true);
            } else {
                this.element.a11y('selectable', {
                    selectable: '[role="tab"]',
                });
            }

            this._on('[role="tab"]', 'a11y:focus', function (event) {
                if ($(event.target).attr('aria-expanded') !== 'true') {
                    $(event.target).click();
                }
            });

            $(this.element).on('collapsible:beforeOpen', function (event, data) {
                var oldActiveTab = self.getActiveTab(),
                    newActiveTab = data.instance.element,
                    prevContent;

                if (self.collapsibles.index(newActiveTab.get(0)) === -1) {
                    return; // nested tabs
                }

                if (oldActiveTab) {
                    prevContent = oldActiveTab.collapsible('instance').content;
                }

                if (data.instance.options.multipleCollapsible) {
                    return;
                }

                self.prevHeight = prevContent ? $(prevContent).outerHeight() : false;
                self.collapsibles.not(newActiveTab).collapsible('close');

                if (newActiveTab && !newActiveTab.isInViewport()) {
                    self.scrollTo(newActiveTab);
                }
            });

            $(this.element).on('collapsible:beforeLoad', function (event, data) {
                if (self.prevHeight && $(window).width() > 767) {
                    data.instance.content.css('height', self.prevHeight);
                }
            });

            $(this.element).on('collapsible:afterLoad', function (event, data) {
                data.instance.content.css('height', 'auto');
            });

            // Reviews and other third-party links
            $(document).on('click.tabs', 'a[href*="#"]', function (event) {
                var anchor = $(this).attr('href').split('#')[1],
                    element,
                    index;

                if (!anchor || self.element.has(this).length) {
                    return;
                }

                if ($(this).parent().collapsible('instance')) {
                    return;
                }

                index = self.findActiveTabIndex('#' + anchor);

                if (index === -1) {
                    return;
                }

                event.preventDefault();
                self.collapsibles.eq(index).collapsible('open');
                element = self.contents.find('#' + anchor);

                if (!element.length) {
                    element = self.contents.eq(index);
                }

                element.show();

                self.scrollTo(element);
            });
        },

        destroy: function () {
            $(document).off('click.tabs');
            this._super();
        },

        scrollTo: function (element) {
            element.get(0).scrollIntoView();
        },

        getActiveTab: function () {
            var tab;

            this.collapsibles.each(function (index, el) {
                if ($(el).collapsible('isActive')) {
                    tab = $(el);

                    return false;
                }
            });

            return tab;
        },

        /** Find active tab index */
        findActiveTabIndex: function (hash) {
            var index = -1,
                activeTrigger,
                activeContent;

            if (!hash || hash.length <= 1) {
                return index;
            }

            activeTrigger = this.triggers.has('[href*="' + hash + '"');

            if (activeTrigger.length) {
                index = this.triggers.index(activeTrigger);
            } else {
                hash = hash.replace(/\./g, '\\.');

                try {
                    activeContent = this.contents.has(hash);
                } catch (e) {
                    return -1;
                }

                if (!activeContent.length) {
                    activeContent = this.contents.filter(hash);
                }

                if (activeContent.length) {
                    index = this.contents.index(activeContent);
                }
            }

            return index;
        }
    });
});
