(function () {
    'use strict';

    $.widget('menu', {
        component: 'menu',
        options: {
            menus: 'ul',
            dropdown: 'ul',
            useInlineDisplay: true,
            responsive: true,
            expanded: false,
            dropdownShowDelay: 80,
            dropdownHideDelay: 120,
            slideoutShowDelay: 42,
            slideoutHideDelay: 300,
            mediaBreakpoint: '(max-width: 767px)'
        },

        /** Init widget */
        create: function () {
            var mql,
                self = this,
                themeBreakpoint = $('body').var('--navigation-media-mobile');

            if (this.options.responsive) {
                mql = window.matchMedia(themeBreakpoint || this.options.mediaBreakpoint);
                mql.addListener(this.toggleMode.bind(this));
                this.toggleMode(mql);
            } else if (this.options.mode === 'mobile') {
                this.toggleMobileMode();
            } else {
                this.toggleDesktopMode();
            }

            this.focusTrap = this.createFocusTrap(this.element.closest('.navigation-wrapper,.nav-sections'));
            this._setActiveMenu(); // varnish fix

            if (this.element.closest('.nav-sections, .page-header, .navigation-wrapper').length) {
                this.addToggleListener();
            }

            $('li.parent > ul', this.element).hide();
            $('li.parent', this.element)
                .children('a')
                .filter(function () {
                    return $(this).children('.ui-icon').length === 0;
                })
                .prepend('<span class="ui-menu-icon ui-icon"></span>');

            $('li.parent', this.element).on('keydown.menu', function (e) {
                var dropdown = $(this).children(self.options.dropdown),
                    visibleDropdowns = $(self.options.dropdown + '.shown');

                if (['Enter', 'Escape', ' '].indexOf(e.key) === -1) {
                    return;
                }

                if (e.key === 'Enter' && dropdown.hasClass('shown')) {
                    return;
                }

                e.stopPropagation();

                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();

                    visibleDropdowns.not(dropdown).each(function () {
                        if (!$(this).has(dropdown.get(0)).length) {
                            self.close($(this));
                        }
                    });

                    if (dropdown.hasClass('shown')) {
                        self.close(dropdown);
                    } else {
                        self.open(dropdown);
                    }
                } else if (e.key === 'Escape' && visibleDropdowns.length) {
                    self.close(visibleDropdowns.last());
                }
            });

            $('a', this.element).on('click.menu', '.ui-icon', function () {
                var dropdown = $(this).closest('a').siblings(self.options.dropdown);

                if (!dropdown.length) {
                    return;
                }

                if (dropdown.hasClass('shown')) {
                    self.close(dropdown);
                } else {
                    self.open(dropdown);
                }

                return false;
            });
        },

        /** Hide expanded menu's, remove event listeneres */
        destroy: function () {
            $.breeze.scrollbar.reset();

            $(this.options.dropdown + '.shown', this.element).each(function (i, dropdown) {
                this.close($(dropdown));
            }.bind(this));
            $('html').removeClass('nav-open').removeClass('nav-before-open');

            if (this.element.closest('.nav-sections, .navigation-wrapper, .page-header').length) {
                $(document).off('click.menu').off('keydown.menu');
            }

            this._super();
        },

        /** [addToggleListener description] */
        addToggleListener: function () {
            $('[data-action="toggle-nav"]').attr('tabindex', 0);

            $(document)
                .on('click.menu', '[data-action="toggle-nav"]', this.toggleNavbar.bind(this))
                .on('keydown.menu', '[data-action="toggle-nav"]', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        this.toggleNavbar();
                    } else if (e.key === 'Escape') {
                        this.closeNavbar();
                    }
                }.bind(this));

            this._on(document, {
                keydown: function (e) {
                    if (e.key === 'Escape' && $('html').hasClass('nav-open')) {
                        this.closeNavbar();
                    }
                }.bind(this)
            });
        },

        /** [toggleNavbar description] */
        toggleNavbar: function (flag) {
            if (flag === false || $('html').hasClass('nav-open')) {
                this.closeNavbar();
            } else {
                this.openNavbar();
            }
        },

        /** Show mobile navbar */
        openNavbar: function () {
            var self = this,
                html = $('html');

            $.breeze.scrollbar.hide();
            self._trigger('navBeforeOpen');
            html.addClass('nav-before-open');
            setTimeout(function () {
                html.addClass('nav-open');
                self._trigger('navAfterOpen');
            }, self.options.slideoutShowDelay);
            setTimeout(self.focusTrap.activate, 300); // wait till css animation is over
        },

        /** Hide mobile navbar  */
        closeNavbar: function () {
            var self = this,
                html = $('html');

            self._trigger('navBeforeClose');
            self.focusTrap.deactivate();
            html.removeClass('nav-open');
            setTimeout(function () {
                $.breeze.scrollbar.reset();
                html.removeClass('nav-before-open');
                self._trigger('navAfterClose');
            }, self.options.slideoutHideDelay);
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
                    var dropdown = $(this).children(self.options.dropdown),
                        delay = self.options.dropdownShowDelay;

                    if (this.breezeTimeout) {
                        clearTimeout(this.breezeTimeout);
                        delete this.breezeTimeout;
                    }

                    if ($(self.options.dropdown + '.shown').length) {
                        delay = 50;
                    }

                    this.breezeTimeout = setTimeout(function () {
                        self.open(dropdown);
                    }, delay);
                })
                .on('mouseleave.menu', function () {
                    if (this.breezeTimeout) {
                        clearTimeout(this.breezeTimeout);
                        delete this.breezeTimeout;
                    }

                    this.breezeTimeout = setTimeout(function () {
                        self.close($(this).children(self.options.dropdown));
                    }.bind(this), self.options.dropdownHideDelay);
                });

            this._trigger('afterToggleDesktopMode');
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

            this._trigger('afterToggleMobileMode');
        },

        /** [open description] */
        open: function (dropdown) {
            this._trigger('beforeOpen', {
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
            var eventData = {
                dropdown: dropdown,
                preventDefault: false
            };

            this._trigger('beforeClose', eventData);

            if (eventData.preventDefault === true) {
                return;
            }

            dropdown.removeClass('shown')
                .parent('li')
                .removeClass('opened');

            if (this.options.useInlineDisplay) {
                dropdown.hide();
            }

            this._trigger('afterClose', {
                dropdown: dropdown
            });
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
})();
