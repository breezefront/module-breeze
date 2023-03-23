(function () {
    'use strict';

    $.active = 0;

    /**
     * @param {Object} response
     * @param {Object} params
     */
    function onResponse(response, params) {
        if (params.global === false) {
            return;
        }

        $(document).trigger('ajaxComplete', {
            response: response
        });
    }

    /**
     * @param {Object} error
     * @throws {Exception}
     */
    function onError(error, params) {
        var failFn = params.fail || params.error,
            alwaysFn = params.always || params.complete;

        if (failFn) {
            failFn(error.response || error.original.response, error);
        }

        if (alwaysFn) {
            alwaysFn(error.response || error.original.response);
        }
    }

    /**
     * @param {Object} response
     * @return {Object}
     */
    function onSuccess(response, params) {
        var doneFn = params.done || params.success,
            alwaysFn = params.always || params.complete;

        if (doneFn) {
            doneFn(response.body || response.text, response);
        }

        if (alwaysFn) {
            alwaysFn(response);
        }

        return response;
    }

    /**
     * @param {Object} params
     * @return {Object}
     */
    function prepareParams(url, params) {
        if (typeof url === 'object') {
            params = url;
        } else if (!params) {
            params = {};
        }

        if (typeof params === 'function') {
            params = {
                success: params
            };
        }

        if (params.each || params instanceof Element) {
            params = {
                form: params
            };
        }

        if (params.form) {
            params.url = params.url || $(params.form).attr('action');
            params.data = params.form;
        }

        if (typeof url === 'string') {
            params.url = url;
        }

        if (params.type && ['post', 'get', 'put', 'delete', 'head'].indexOf(params.type.toLowerCase()) > -1) {
            params.method = params.type.toLowerCase();
        }

        params.headers = Object.assign({
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded'
        }, params.headers || {});

        if (params.type === 'json') {
            params.headers['Content-Type'] = 'application/json';
        }

        if (params.contentType) {
            params.headers['Content-Type'] = params.contentType;
        } else if (params.contentType === false) {
            delete params.headers['Content-Type'];
        }

        // cache: true/false is not supported
        if (typeof params.cache !== 'string') {
            delete params.cache;
        }

        return params;
    }

    /**
     * @param {Object} data
     * @return {FormData}
     */
    function toFormData(data) {
        var formData,
            formKey = $.cookies.get('form_key');

        if (data.each && data.get) {
            data = data.get(0);
        }

        if (data instanceof FormData) {
            formData = data;
        } else if (data instanceof Element) {
            formData = new FormData(data);
        } else {
            formData = new FormData();

            if (typeof data === 'string') {
                data = $.parseQuery(data);
            }

            _.each(data, function (value, key) {
                if (_.isArray(value)) {
                    key = key.includes('[') ? key : key + '[]';
                    value.map((val) => formData.append(key, val));
                } else if (_.isObject(value)) {
                    $.params({[key]: value}).split('&').map(pair => {
                        formData.set(...pair.split('='));
                    });
                } else {
                    formData.set(key, value);
                }
            });
        }

        if (!formData.has('form_key')) {
            formData.set('form_key', formKey);
        }

        return formData;
    }

    function toJsonData(formData) {
        var object = {};

        formData.forEach((value, key) => {
            if (!Reflect.has(object, key)) {
                object[key] = value;
                return;
            }

            if (!Array.isArray(object[key])) {
                object[key] = [object[key]];
            }

            object[key].push(value);
        });

        return object;
    }

    function send(params) {
        if (params.method === 'get' && params.data) {
            params.url += params.url.indexOf('?') === -1 ? '?' : '&';

            if (typeof params.data !== 'string') {
                params.data = $.params(params.data);
            }

            params.url += params.data;
        } else if (params.method === 'post' && params.data) {
            if (typeof params.data !== 'string') {
                params.body = toFormData(params.data);
                delete params.headers['Content-Type'];
            } else {
                params.body = params.data;
            }
        }

        if (params.context) {
            ['done', 'always', 'fail', 'success', 'complete', 'error', 'beforeSend'].forEach(function (fn) {
                if (params[fn]) {
                    params[fn] = params[fn].bind(params.context);
                }
            });
        }

        if (params.beforeSend) {
            params.beforeSend(params);
        }

        $.active++;

        return fetch(params.url, params)
            .then(function (response) {
                if (!response.ok) {
                    var error = new Error(response.code);
                    error.response = response;
                    throw error;
                }

                return response.text();
            })
            .then(function (text) {
                var response = {
                    text: text,
                    req: params
                };

                $.active--;

                response.body = (function () {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        if (!params.dataType && !params.type ||
                            params.dataType && params.dataType !== 'json' ||
                            params.type && params.type !== 'json'
                        ) {
                            return text;
                        }

                        e.response = response;

                        throw e;
                    }
                })();

                onResponse(response, params);

                return response;
            })
            .then(function (response) {
                try {
                    return onSuccess(response, params);
                } catch (e) {
                    console.error(e);
                }
            })
            .catch(function (error) {
                return onError(error, params);
            });
    }

    $.request = {
        /**
         * @param {Object} params
         * @return {Promise}
         */
        send: function (url, params) {
            params = prepareParams(url, params);

            return this[params.method || 'get'](params);
        },

        /**
         * @param {Object} params
         * @return {Promise}
         */
        post: function (url, params) {
            params = prepareParams(url, params);
            params.method = 'post';

            return send(params);
        },

        /**
         * @param {Object} params
         * @return {Promise}
         */
        get: function (url, params) {
            params = prepareParams(url, params);
            params.method = 'get';

            return send(params);
        }
    };

    /** [get description] */
    $.ajax = function (url, params) {
        return $.request.send(url, params);
    };

    /** [get description] */
    $.get = function (url, params) {
        return $.request.get(url, params);
    };

    /** [get description] */
    $.post = function (url, params) {
        return $.request.post(url, params);
    };
})();
