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
        if (params.error) {
            params.error(error.response || error.original.response, error);
        }

        if (params.complete) {
            params.complete(error.response || error.original.response);
        }
    }

    /**
     * @param {Object} response
     * @return {Object}
     */
    function onSuccess(response, params) {
        if (params.success) {
            params.success(response.body || response.text, response);
        }

        if (params.complete) {
            params.complete(response);
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

        if (typeof url === 'string') {
            params.url = url;
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

        if (data instanceof Element) {
            formData = new FormData(data);
        } else {
            formData = new FormData();

            if (typeof data === 'string') {
                data = $.parseQuery(data);
            }

            _.each(data, function (value, key) {
                formData.set(key, value);
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
        params.headers = params.headers || {};
        params.headers['X-Requested-With'] = 'XMLHttpRequest';
        params.headers['Content-Type'] = 'application/x-www-form-urlencoded';

        if (params.type === 'json' || params.dataType === 'json') {
            params.headers['Content-Type'] = 'application/json';
        }

        if (params.data) {
            if (!params.method || params.method.toLowerCase() === 'get') {
                params.url += params.url.indexOf('?') === -1 ? '?' : '&';
                params.url += $.params(params.data);
            } else if (params.processData !== false &&
                params.headers['Content-Type'] === 'application/json'
            ) {
                params.body = JSON.stringify(toJsonData(params.data));
            } else {
                params.body = params.data;
                delete params.headers['Content-Type'];
            }
        }

        if (params.context) {
            ['success', 'complete', 'error', 'beforeSend'].forEach(function (fn) {
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

            if (params.each || params instanceof Element) {
                params = {
                    form: params
                };
            }

            if (params.form) {
                params.url = params.url || $(params.form).attr('action');
                params.data = params.form;
                params.processData = false;
            }

            if (params.data) {
                params.data = toFormData(params.data);
            }

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
