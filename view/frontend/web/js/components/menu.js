/* global breeze */
(function () {
    'use strict';

    breeze.widget('menu', {
        options: {
            menus: 'ul',
            dropdown: 'ul',
            useInlineDisplay: true,
            responsive: true,
            expanded: false,
            showDelay: 42,
            hideDelay: 300,
            mediaBreakpoint: '(max-width: 767px)'
        },

        /** Init widget */
        create: function () {
            var mql;

            if (this.options.responsive) {
                mql = window.matchMedia(this.options.mediaBreakpoint);
                mql.addListener(this.toggleMode.bind(this));
                this.toggleMode(mql);
            } else if (this.options.mode === 'mobile') {
                this.toggleMobileMode();
            } else {
                this.toggleDesktopMode();
            }

            this._setActiveMenu(); // varnish fix

            if (this.options.expanded) {
                this.expand();
            }

            $(document).on('click.menu', '[data-action="toggle-nav"]', function () {
                var html = $('html');

                if (html.hasClass('nav-open')) {
                    html.removeClass('nav-open');
                    setTimeout(function () {
                        html.removeClass('nav-before-open');
                    }, this.options.hideDelay);
                } else {
                    html.addClass('nav-before-open');
                    setTimeout(function () {
                        html.addClass('nav-open');
                    }, this.options.showDelay);
                }
            }.bind(this));

            $('li.parent > ul', this.element).hide();
            $('li.parent', this.element)
                .children('a')
                .filter(function () {
                    return $(this).children('.ui-icon').length === 0;
                })
                .prepend('<span class="ui-menu-icon ui-icon"></span>');
        },

        /** Hide expanded menu's, remove event listeneres */
        destroy: function () {
            $('ul.shown', this.element).removeClass('shown').hide();
            $('html').removeClass('nav-open').removeClass('nav-before-open');
            $(document).off('click.menu');
        },

        /** Expand nested menus */
        expand: function () {
            var subMenus = this.element.find(this.options.menus),
                expandedMenus = subMenus.find(this.options.menus);

            expandedMenus.addClass('shown').addClass('expanded');
        },

        /** Toggles between mobile and desktop modes */
        toggleMode: function (event) {
            if (event.matches) {
                this.toggleMobileMode();
            } else {
                this.toggleDesktopMode();
            }
        },

        /** Enable desktop mode */
        toggleDesktopMode: function () {
            var self = this;

            $(self.options.dropdown + '.shown').each(function () {
                self.close($(this));
            });

            $('li.parent', this.element)
                .off('click.menu')
                .on('mouseenter.menu', function () {
                    var dropdown = $(this).children(self.options.dropdown);

                    if (this.breezeTimeout) {
                        clearTimeout(this.breezeTimeout);
                        delete this.breezeTimeout;
                    }

                    self.open(dropdown);
                })
                .on('mouseleave.menu', function () {
                    this.breezeTimeout = setTimeout(function () {
                        self.close($(this).children(self.options.dropdown));
                    }.bind(this), 80);
                });
        },

        /** Enable mobile mode */
        toggleMobileMode: function () {
            var self = this;

            $('li.parent', this.element)
                .off('mouseenter.menu mouseleave.menu')
                .on('click.menu', function () {
                    var dropdown = $(this).children(self.options.dropdown);

                    if (!dropdown.length || dropdown.hasClass('shown')) {
                        return;
                    }

                    self.open(dropdown);

                    return false;
                });
        },

        /** [open description] */
        open: function (dropdown) {
            $(this.element).trigger('menu:beforeOpen', {
                dropdown: dropdown
            });

            dropdown.addClass('shown')
                .parent('li')
                .addClass('opened');

            if (this.options.useInlineDisplay) {
                dropdown.show();
            }
        },

        /** [open description] */
        close: function (dropdown) {
            $(this.element).trigger('menu:beforeClose', {
                dropdown: dropdown
            });

            dropdown.removeClass('shown')
                .parent('li')
                .removeClass('opened');

            if (this.options.useInlineDisplay) {
                dropdown.hide();
            }
        },

        /** [_setActiveMenu description] */
        _setActiveMenu: function () {
            var currentUrl = window.location.href.split('?')[0];

            if (!this._setActiveMenuForCategory(currentUrl)) {
                this._setActiveMenuForProduct(currentUrl);
            }
        },

        /** [_setActiveMenuForCategory description] */
        _setActiveMenuForCategory: function (url) {
            var activeCategoryLink = this.element.find('a[href="' + url + '"]'),
                classes,
                classNav;

            if (!activeCategoryLink || !activeCategoryLink.parent().hasClass('category-item')) {
                return false;
            } else if (!activeCategoryLink.parent().hasClass('active')) {
                activeCategoryLink.parent().addClass('active');
                classes = activeCategoryLink.parent().attr('class');
                classNav = classes.match(/(nav\-)[0-9]+(\-[0-9]+)+/gi);

                if (classNav) {
                    this._setActiveParent(classNav[0]);
                }
            }

            return true;
        },

        /** [_setActiveParent description] */
        _setActiveParent: function (childClassName) {
            var parentElement,
                parentClass = childClassName.substr(0, childClassName.lastIndexOf('-'));

            if (parentClass.lastIndexOf('-') !== -1) {
                parentElement = this.element.find('.' + parentClass);

                if (parentElement) {
                    parentElement.addClass('has-active');
                }
                this._setActiveParent(parentClass);
            }
        },

        /** [_setActiveMenuForProduct description] */
        _setActiveMenuForProduct: function (currentUrl) {
            var categoryUrlExtension,
                lastUrlSection,
                possibleCategoryUrl,
                //retrieve first category URL to know what extension is used for category URLs
                firstCategoryUrl = this.element.children('li').find('a').attr('href');

            if (firstCategoryUrl) {
                lastUrlSection = firstCategoryUrl.substr(firstCategoryUrl.lastIndexOf('/'));
                categoryUrlExtension = lastUrlSection.lastIndexOf('.') !== -1 ?
                    lastUrlSection.substr(lastUrlSection.lastIndexOf('.')) : '';

                possibleCategoryUrl = currentUrl.substr(0, currentUrl.lastIndexOf('/')) + categoryUrlExtension;
                this._setActiveMenuForCategory(possibleCategoryUrl);
            }
        }
    });

    $(document).on('breeze:mount:menu', function (event, data) {
        $(data.el).menu(data.settings);
    });
})();
