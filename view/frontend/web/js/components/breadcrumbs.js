(function () {
    'use strict';

    $.widget('breadcrumbs', {
        component: 'breadcrumbs',
        options: {
            categoryUrlSuffix: '',
            useCategoryPathInUrl: false,
            product: '',
            categoryItemSelector: '.category-item',
            menuContainer: '[data-action="navigation"] > ul'
        },

        create: function () {
            this.breadcrumbs = [{
                name: 'home',
                label: $.__('Home'),
                title: $.__('Go to Home Page'),
                link: window.BASE_URL || ''
            }];

            this._appendCatalogCrumbs();
            this._decorate(this.breadcrumbs);

            if ($('script#breadcrumbs').length) {
                this.element.html(_.template($('script#breadcrumbs').html())({
                    'breadcrumbs': this.breadcrumbs
                }));
            }
        },

        /**
         * @param {Array} list
         */
        _decorate: function (list) {
            if (list.length) {
                list[0].first = true;
            }

            if (list.length > 1) {
                list[list.length - 1].last = true;
            }
        },

        _appendCatalogCrumbs: function () {
            var self = this,
                categoryCrumbs = this._resolveCategoryCrumbs();

            categoryCrumbs.forEach(function (crumbInfo) {
                self.breadcrumbs.push(crumbInfo);
            });

            if (this.options.product) {
                self.breadcrumbs.push(this._getProductCrumb());
            }
        },

        /**
         * @return Array
         */
        _resolveCategoryCrumbs: function () {
            var menuItem = this._resolveCategoryMenuItem(),
                categoryCrumbs = [];

            if (menuItem !== null && menuItem.length) {
                categoryCrumbs.unshift(this._getCategoryCrumb(menuItem));

                while ((menuItem = this._getParentMenuItem(menuItem)) !== null) {
                    categoryCrumbs.unshift(this._getCategoryCrumb(menuItem));
                }
            }

            return categoryCrumbs;
        },

        /**
         * Returns crumb data.
         *
         * @param {Object} menuItem
         * @return {Object}
         */
        _getCategoryCrumb: function (menuItem) {
            return {
                'name': 'category',
                'label': menuItem.text(),
                'link': menuItem.attr('href'),
                'title': ''
            };
        },

        /**
         * Returns product crumb.
         *
         * @return {Object}
         */
        _getProductCrumb: function () {
            return {
                'name': 'product',
                'label': this.options.product,
                'link': '',
                'title': ''
            };
        },

        /**
         * Find parent menu item for current.
         *
         * @param {Object} menuItem
         * @return {Object|null}
         */
        _getParentMenuItem: function (menuItem) {
            var classes,
                classNav,
                parentClass,
                parentMenuItem = null;

            if (!menuItem) {
                return null;
            }

            classes = menuItem.parent().attr('class');
            classNav = classes.match(/(nav\-)[0-9]+(\-[0-9]+)+/gi);

            if (classNav) {
                classNav = classNav[0];
                parentClass = classNav.substr(0, classNav.lastIndexOf('-'));

                if (parentClass.lastIndexOf('-') !== -1) {
                    parentMenuItem = $(this.options.menuContainer).find('.' + parentClass + ' > a');
                    parentMenuItem = parentMenuItem.length ? parentMenuItem : null;
                }
            }

            return parentMenuItem;
        },

        /**
         * Returns category menu item.
         *
         * Tries to resolve category from url or from referrer as fallback and
         * find menu item from navigation menu by category url.
         *
         * @return {Object|null}
         */
        _resolveCategoryMenuItem: function () {
            var categoryUrl = this._resolveCategoryUrl(),
                menu = $(this.options.menuContainer),
                categoryMenuItem = null;

            if (categoryUrl && menu.length) {
                categoryMenuItem = menu.find(
                    this.options.categoryItemSelector +
                    ' > a[href="' + categoryUrl + '"]'
                );
            }

            return categoryMenuItem;
        },

        /**
         * @return {String}
         */
        _resolveCategoryUrl: function () {
            var categoryUrl;

            if (this.options.useCategoryPathInUrl) {
                // In case category path is used in product url - resolve category url from current url.
                categoryUrl = window.location.href.split('?')[0];
                categoryUrl = categoryUrl.substring(0, categoryUrl.lastIndexOf('/')) +
                    this.options.categoryUrlSuffix;
            } else {
                // In other case - try to resolve it from referrer (without parameters).
                categoryUrl = document.referrer;

                if (categoryUrl.indexOf('?') > 0) {
                    categoryUrl = categoryUrl.substr(0, categoryUrl.indexOf('?'));
                }
            }

            return categoryUrl;
        }
    });
})();
