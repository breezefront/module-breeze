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
            response: response,
            responseText: response.text,
            settings: {
                url: response.req.url,
            }
        });
    }

    /**
     * @param {Object} error
     * @throws {Exception}
     */
    function onError(error, params) {
        var response = error.response || error.original?.response;

        params.fail.push(params.error);
        params.always.push(params.complete);

        params.fail.filter(fn => fn).forEach(fn => fn(response, error));
        params.always.filter(fn => fn).forEach(fn => fn(response));
    }

    /**
     * @param {Object} response
     * @return {Object}
     */
    function onSuccess(response, params) {
        params.done.push(params.success);
        params.always.push(params.complete);

        params.done.filter(fn => fn).forEach(fn => fn(response.body || response.text, response));
        params.always.filter(fn => fn).forEach(fn => fn(response));

        return response;
    }

    /**
     * @param {String|Object} url
     * @param {Object|Function} params
     * @return {Object}
     */
    function prepareParams(url, params) {
        var success = typeof params === 'function' ? params : false;

        if (typeof url === 'object') {
            params = url;
        } else if (!params || success) {
            params = {};
        }

        if (success) {
            params.success = success;
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

        _.each(params.headers, (value, key) => {
            if (value === null || value === false) {
                delete params.headers[key];
            }
        });

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
                    $.params({[key]: value}, false, true).split('&').map(pair => {
                        var parts = pair.split('='),
                            v = parts.pop(),
                            k = parts.join('=');

                        formData.append(k, v);
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

    function send(params) {
        var controller = new AbortController();

        if (!params.signal) {
            params.signal = controller.signal;
        }

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

        $(document).trigger('ajaxSend', {
            settings: params,
        });
        if (params.beforeSend) {
            params.beforeSend(params);
        }

        $.active++;

        // eslint-disable-next-line one-var, vars-on-top
        var result = fetch(params.url, params)
            .then(function (response) {
                var error;

                if (!response.ok) {
                    error = new Error(response.code);
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

        // Emulate jQuery's functions that are not avaialble in native Promise
        ['done', 'fail', 'always'].forEach(name => {
            params[name] = params[name] ? [params[name]] : [];
            result[name] = function (fn) { params[name].push(fn); };
        });

        result.abort = () => controller.abort();

        return result;
    }

    $.request = {
        /**
         * @param {Object} params
         * @return {Promise}
         */
        send: function (url, params) {
            params = prepareParams(url, params);
            params.method = params.method || 'get';

            return send(params);
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

    $.ajax = function (url, params) {
        return $.request.send(url, params);
    };

    $.get = function (url, params) {
        return $.request.get(url, params);
    };

    $.post = function (url, params) {
        return $.request.post(url, params);
    };
})();
