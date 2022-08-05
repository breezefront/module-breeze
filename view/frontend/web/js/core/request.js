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
    function prepareParams(params) {
        if (typeof params === 'string') {
            params = {
                url: params
            };
        }

        return params;
    }

    /**
     * @param {Object} data
     * @return {Object}
     */
    function prepareData(data) {
        var formData,
            formKey = $.cookies.get('form_key');

        if (data.each && data.get) {
            data = data.get(0);
        }

        if (typeof data === 'string') {
            formData = new FormData();
            formData.set('form_key', formKey);

            _.each($.parseQuery(data), function (value, key) {
                formData.set(key, value);
            });

            data = formData;
        } else if (data instanceof Element) {
            data = new FormData(data);

            if (!data.has('form_key')) {
                data.set('form_key', formKey);
            }
        } else if (!data.form_key) {
            data.form_key = formKey;
        }

        return data;
    }

    function send(params) {
        params.headers = params.headers || {};
        params.headers['X-Requested-With'] = 'XMLHttpRequest';
        params.headers['Content-Type'] = 'application/x-www-form-urlencoded';

        if (params.type === 'json' || params.dataType === 'json') {
            params.headers['Content-Type'] = 'application/json';
        }

        if (params.data) {
            if (!params.method || params.method === 'get') {
                params.url += params.url.indexOf('?') === -1 ? '?' : '&';
                params.url += $.params(params.data);
            } else if (params.data instanceof FormData) {
                params.body = params.data;
                delete params.headers['Content-Type'];
            } else {
                params.body = $.params(params.data);
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
        send: function (params) {
            return this[params.method || 'get'](params);
        },

        /**
         * @param {Object} params
         * @return {Promise}
         */
        post: function (params) {
            params = prepareParams(params);
            params.method = 'post';

            if (params.each || params instanceof Element) {
                params = {
                    form: params
                };
            }

            if (params.form) {
                params.url = params.url || $(params.form).attr('action');
                params.data = params.form;
            }

            if (params.data) {
                params.data = prepareData(params.data);
            }

            return send(params);
        },

        /**
         * @param {Object} params
         * @return {Promise}
         */
        get: function (params) {
            params = prepareParams(params);
            params.method = 'get';

            return send(params);
        }
    };

    /** [get description] */
    $.ajax = function (params) {
        return $.request.send(params);
    };

    /** [get description] */
    $.get = function (params) {
        return $.request.get(params);
    };

    /** [get description] */
    $.post = function (params) {
        return $.request.post(params);
    };
})();
