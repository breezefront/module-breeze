(function () {
    'use strict';

    $.widget('productListToolbarForm', {
        component: 'productListToolbarForm',
        options: {
            modeControl: '[data-role="mode-switcher"]',
            directionControl: '[data-role="direction-switcher"]',
            orderControl: '[data-role="sorter"]',
            limitControl: '[data-role="limiter"]',
            mode: 'product_list_mode',
            direction: 'product_list_dir',
            order: 'product_list_order',
            limit: 'product_list_limit',
            page: 'p',
            modeDefault: 'grid',
            directionDefault: 'asc',
            orderDefault: 'position',
            limitDefault: '9',
            url: ''
        },

        create: function () {
            var self = this,
                controls = [
                    'mode',
                    'direction',
                    'order',
                    'limit'
                ];

            $.each(controls, function (i, param) {
                self.addEventListener(
                    $(self.options[param + 'Control'], self.element),
                    self.options[param],
                    self.options[param + 'Default']
                );
            });
        },

        addEventListener: function (element, paramName, defaultValue) {
            var self = this;

            if (element.is('select')) {
                element.on('change', function () {
                    self.changeUrl(paramName, element.val(), defaultValue);
                });
            } else {
                element.on('click', function (event) {
                    event.preventDefault();
                    self.changeUrl(paramName, $(event.currentTarget).data('value'), defaultValue);
                });
            }
        },

        getUrlParams: function () {
            var decode = window.decodeURIComponent,
                urlPaths = this.options.url.split('?'),
                urlParams = urlPaths[1] ? urlPaths[1].split('&') : [],
                params = {},
                parameters, i;

            for (i = 0; i < urlParams.length; i++) {
                parameters = urlParams[i].split('=');
                params[decode(parameters[0])] = parameters[1] !== undefined ?
                    decode(parameters[1].replace(/\+/g, '%20')) :
                    '';
            }

            return params;
        },

        getCurrentLimit: function () {
            return this.getUrlParams()[this.options.limit] || this.options.limitDefault;
        },

        getCurrentPage: function () {
            return this.getUrlParams()[this.options.page] || 1;
        },

        /**
         * @param {String} paramName
         * @param {*} paramValue
         * @param {*} defaultValue
         */
        changeUrl: function (paramName, paramValue, defaultValue) {
            var urlPaths = this.options.url.split('?'),
                baseUrl = urlPaths[0],
                paramData = this.getUrlParams(),
                currentPage = this.getCurrentPage(),
                newPage;

            if (currentPage > 1 && paramName === this.options.limit) {
                newPage = Math.floor(this.getCurrentLimit() * (currentPage - 1) / paramValue) + 1;

                if (newPage > 1) {
                    paramData[this.options.page] = newPage;
                } else {
                    delete paramData[this.options.page];
                }
            }

            paramData[paramName] = paramValue;

            if (paramValue == defaultValue) { //eslint-disable-line eqeqeq
                delete paramData[paramName];
            }

            paramData = $.params(paramData);
            $.breeze.visit(baseUrl + (paramData.length ? '?' + paramData : ''));
        }
    });
})();
