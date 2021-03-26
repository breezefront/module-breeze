/* global breeze */
(function () {
    'use strict';

    breeze.widget('menu', {
        options: {
            menus: 'ul',
            responsive: false,
            expanded: false,
            showDelay: 42,
            hideDelay: 300,
            mediaBreakpoint: '(max-width: 767px)'
        },

        /** Init widget */
        create: function () {
            var mql = window.matchMedia(this.options.mediaBreakpoint);

            if (this.options.responsive) {
                mql.addListener(this.toggleMode.bind(this));
                this.toggleMode(mql);
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
            $('ul.shown', this.element).removeClass('shown').hide();
            $('li.parent', this.element)
                .off('click.menu')
                .on('mouseenter.menu', function () {
                    if (this.breezeTimeout) {
                        clearTimeout(this.breezeTimeout);
                        delete this.breezeTimeout;
                    }

                    $(this).children('ul').addClass('shown').show();
                })
                .on('mouseleave.menu', function () {
                    this.breezeTimeout = setTimeout(function () {
                        $(this).children('ul').removeClass('shown').hide();
                    }.bind(this), 80);
                });
        },

        /** Enable mobile mode */
        toggleMobileMode: function () {
            $('li.parent', this.element)
                .off('mouseenter.menu mouseleave.menu')
                .on('click.menu', function () {
                    var ul = $(this).children('ul');

                    if (!ul.length || ul.hasClass('shown')) {
                        return;
                    }

                    ul.addClass('shown').show();

                    return false;
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
                firstCategoryUrl = this.element.find('> li a').attr('href');

            if (firstCategoryUrl) {
                lastUrlSection = firstCategoryUrl.substr(firstCategoryUrl.lastIndexOf('/'));
                categoryUrlExtension = lastUrlSection.lastIndexOf('.') !== -1 ?
                    lastUrlSection.substr(lastUrlSection.lastIndexOf('.')) : '';

                possibleCategoryUrl = currentUrl.substr(0, currentUrl.lastIndexOf('/')) + categoryUrlExtension;
                this._setActiveMenuForCategory(possibleCategoryUrl);
            }
        }
    });

    document.addEventListener('breeze:mount:menu', function (event) {
        $(event.detail.el).menu(event.detail.settings);
    });
})();
