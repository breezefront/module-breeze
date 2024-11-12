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
            dropdownShowDelay: 100,
            dropdownHideDelay: 120,
            mediaBreakpoint: '(max-width: 767px)'
        },

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

            this._setActiveMenu(); // varnish fix

            $('.li-item').addClass('ui-menu-item');
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

                if (!['Enter', 'Escape', ' '].includes(e.key)) {
                    return;
                }

                if (e.key === 'Enter' && dropdown.hasClass('shown')) {
                    return;
                }

                if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
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
                    e.stopPropagation();
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
            $(this.options.dropdown + '.shown', this.element).each(function (i, dropdown) {
                this.close($(dropdown));
            }.bind(this));

            this._super();
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

        _setActiveMenu: function () {
            var currentUrl = window.location.href.split('?')[0];

            if (!this._setActiveMenuForCategory(currentUrl)) {
                this._setActiveMenuForProduct(currentUrl);
            }
        },

        _setActiveMenuForCategory: function (url) {
            var activeCategoryLink = this.element.find('a[href="' + url + '"]'),
                classes,
                classNav;

            if (!activeCategoryLink || !activeCategoryLink.parent().is('.category-item, .li-item')) {
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

        _setActiveParent: function (childClassName) {
            var parentElement,
                parentClass = childClassName.substr(0, childClassName.lastIndexOf('-'));

            if (parentClass.includes('-')) {
                parentElement = this.element.find('.' + parentClass);

                if (parentElement) {
                    parentElement.addClass('has-active');
                }
                this._setActiveParent(parentClass);
            }
        },

        _setActiveMenuForProduct: function (currentUrl) {
            var categoryUrlExtension,
                lastUrlSection,
                possibleCategoryUrl,
                //retrieve first category URL to know what extension is used for category URLs
                firstCategoryUrl = this.element.children('li').find('a').attr('href');

            if (firstCategoryUrl) {
                lastUrlSection = firstCategoryUrl.substr(firstCategoryUrl.lastIndexOf('/'));
                categoryUrlExtension = lastUrlSection.includes('.')
                    ? lastUrlSection.substr(lastUrlSection.lastIndexOf('.'))
                    : '';

                possibleCategoryUrl = currentUrl.substr(0, currentUrl.lastIndexOf('/')) + categoryUrlExtension;
                this._setActiveMenuForCategory(possibleCategoryUrl);
            }
        }
    });

    $.widget('menuSlideout', {
        options: {
            openDelay: 42,
            closeDelay: 300
        },

        create: function () {
            $(this.element).attr('tabindex', 0);

            this.focusTrap = this.createFocusTrap($('.navigation-wrapper, .nav-sections').first());

            this._on({
                click: this.toggle,
                keydown: e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        this.toggle();
                    } else if (e.key === 'Escape') {
                        this.close();
                    }
                }
            });

            this._on(document, 'keydown', e => {
                if (e.key === 'Escape' && $('html').hasClass('nav-open')) {
                    this.close();
                }
            });
        },

        destroy: function () {
            $.breeze.scrollbar.reset();
            $('html').removeClass('nav-open').removeClass('nav-before-open');
            this._super();
        },

        toggle: function (flag) {
            if (flag === false || $('html').hasClass('nav-open')) {
                this.close();
            } else {
                this.open();
            }
        },

        open: function () {
            $.breeze.scrollbar.hide();
            this._trigger('beforeOpen');
            $('html').addClass('nav-before-open');
            setTimeout(() => {
                $('html').addClass('nav-open');
                this._trigger('afterOpen');
            }, this.options.openDelay);
            setTimeout(this.focusTrap.activate, 300); // wait till css animation is over
        },

        close: function () {
            this._trigger('beforeClose');
            this.focusTrap.deactivate();
            $('html').removeClass('nav-open');
            setTimeout(() => {
                $.breeze.scrollbar.reset();
                $('html').removeClass('nav-before-open');
                this._trigger('afterClose');
            }, this.options.closeDelay);
        }
    });

    $(document).on('breeze:load', () => $('[data-action="toggle-nav"]').menuSlideout());
})();
