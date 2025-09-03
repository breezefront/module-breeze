(function () {
    'use strict';

    $.active = 0;

    /**
     * @param {Object} jqXHR
     * @param {Object} params
     */
    function onResponse(jqXHR, params) {
        var data = {
            response: jqXHR,
            responseText: jqXHR.text,
            settings: params,
        };

        if (params.global === false) {
            return;
        }

        if (jqXHR.responseJSON) {
            data.responseJSON = jqXHR.responseJSON;
        }

        $(document).trigger('ajaxComplete', data);
    }

    /**
     * @param {Object} jqXHR
     * @param {Object} params
     * @param {Object} error
     * @throws {Exception}
     */
    function onError(jqXHR, params, error) {
        params.fail.push(params.error);
        params.fail.filter(fn => fn).forEach(fn => fn(jqXHR, 'error', error));
        params.always.filter(fn => fn).forEach(fn => fn(jqXHR, 'error', error));
        params.complete?.(jqXHR, 'error');

        $(document).trigger('ajaxError', {
            response: jqXHR,
            responseText: jqXHR.text,
            settings: params,
            error: error,
            status: jqXHR.status,
        });
    }

    /**
     * @param {Object} jqXHR
     * @param {Object} params
     */
    function onSuccess(jqXHR, params) {
        params.done.push(params.success);
        params.done.filter(fn => fn).forEach(fn => fn(jqXHR.body, 'success', jqXHR));
        params.always.filter(fn => fn).forEach(fn => fn(jqXHR.body, 'success', jqXHR));
        params.complete?.(jqXHR, 'success');
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

        if (params.type) {
            if (['post', 'get', 'put', 'delete', 'head'].includes(params.type.toLowerCase())) {
                params.method = params.type.toLowerCase();
            } else if (!params.dataType) {
                params.dataType = params.type;
            }
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
            formKey = (document.cookie.match('(^|; )form_key=([^;]*)') || 0)[2] || '';

        if (data.each && data.get) {
            data = data.get(0);
        }

        if (data instanceof FormData) {
            formData = data;
        } else if (data instanceof Element) {
            formData = new FormData(data);
        } else {
            formData = new FormData();

            if (data instanceof URLSearchParams) {
                data = data.toString();
            }

            if (typeof data === 'string') {
                data = $.parseQuery(data);
            } else if (_.isArray(data)) {
                data = data.reduce((result, item) => {
                    result[item.name] = item.value;
                    return result;
                }, {});
            }

            _.each(data, function (value, key) {
                if (_.isFunction(value)) {
                    value = value();
                }

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

    async function emulateJqXHR(response, params) {
        var text = await response.text();

        return {
            text: text,
            body: text,
            response: response,
            responseText: text,
            readyState: 4,
            status: response.status,
            statusText: response.statusText,
            url: params.url,
            method: params.method,
            ...(params.body && { data: params.body }),
            getResponseHeader: (name) => response.headers.get(name),
            getAllResponseHeaders: () => {
                return [...response.headers.entries()].reduce((acc, [key, value]) => {
                  return acc + `${key}: ${value}\r\n`;
                }, '');
            },
        };
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
                params.data = params.body;
                delete params.headers['Content-Type'];
            } else {
                params.body = params.data;
            }
        }

        ['done', 'always', 'fail', 'success', 'complete', 'error', 'beforeSend'].forEach(function (fn) {
            if (params[fn]) {
                params[fn] = params[fn].bind(params.context || params);
            }
        });

        $(document).trigger('ajaxSend', {
            settings: params,
        });
        if (params.beforeSend && params.beforeSend(params, params) === false) {
            return;
        }

        $.active++;

        // eslint-disable-next-line one-var, vars-on-top
        var result = fetch(params.url, params)
            .then(async function (response) {
                var error,
                    jqXHR = await emulateJqXHR(response, params),
                    contentType = jqXHR.getResponseHeader('Content-Type');

                if (!response.ok) {
                    error = new Error(response.code);
                    error.xhr = jqXHR;
                    throw error;
                }

                if (params.dataType === 'json' || contentType?.includes('application/json')) {
                    try {
                        jqXHR.body = JSON.parse(jqXHR.text);
                        jqXHR.responseJSON = jqXHR.body;
                    } catch (e) {
                        e.xhr = jqXHR;
                        throw e;
                    }
                }

                onResponse(jqXHR, params);

                try {
                    onSuccess(jqXHR, params);
                } catch (e) {
                    console.error(e);
                }

                return jqXHR;
            })
            .catch(function (error) {
                return onError(error.xhr, params, error);
            })
            .finally(() => {
                $.active--;
            });

        // Emulate jQuery's functions that are not avaialble in native Promise
        ['done', 'fail', 'always'].forEach(name => {
            params[name] = params[name] ? [params[name]] : [];
            result[name] = function (fn) {
                params[name].push(fn);
                return this;
            };
        });

        result.abort = () => controller.abort();

        function createWrapper(o) {
            return {
                then: (...args) => createWrapper(o.then(...args)),
                catch: (...args) => createWrapper(o.catch(...args)),
                always: cb => createWrapper(o.then(cb, cb)),
            };
        }

        return createWrapper(result);
    }

    $.request = {
        /**
         * @param {Object} params
         * @return {Promise}
         */
        send: function (url, params) {
            params = prepareParams(url, params);
            params.type = params.method = params.method?.toLowerCase() || 'get';

            return send(params);
        },

        /**
         * @param {Object} params
         * @return {Promise}
         */
        post: function (url, data, success) {
            var params = data && !_.isFunction(data) ? _.pick({ data: data, success: success }, v => v) : data;

            params = prepareParams(url, params);
            params.type = params.method = 'post';

            return send(params);
        },

        /**
         * @param {Object} params
         * @return {Promise}
         */
        get: function (url, data, success) {
            var params = data && !_.isFunction(data) ? _.pick({ data: data, success: success }, v => v) : data;

            params = prepareParams(url, params);
            params.type = params.method = 'get';

            return send(params);
        }
    };

    $.ajax = $.request.send;
    $.get = $.getJSON = $.request.get;
    $.post = $.request.post;

    function storageRequest(url, global, contentType, headers, method, data) {
        if (!url.startsWith('http')) {
            url = window.BASE_URL + url;
        }

        return $.ajax(url, {
            data, global, headers, method,
            contentType: contentType || 'application/json',
        });
    }

    $.breezemap['mage/storage'] = {
        get: (url, global, contentType, headers) =>
            storageRequest(url, global, contentType, headers, 'get'),
        post: (url, data, global, contentType, headers) =>
            storageRequest(url, global, contentType, headers, 'post', data),
        put: (url, data, global, contentType, headers) =>
            storageRequest(url, global, contentType, headers, 'put', data),
        delete: (url, global, contentType, headers) =>
            storageRequest(url, global, contentType, headers, 'delete'),
    };
})();
