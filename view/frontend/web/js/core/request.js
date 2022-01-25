/* global superagent */
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
        var formKey = $.cookies.get('form_key');

        if (data.each && data.get) {
            data = data.get(0);
        }

        if (data instanceof Element) {
            data = new FormData(data);

            if (!data.has('form_key')) {
                data.set('form_key', formKey);
            }
        } else if (!data.form_key) {
            data.form_key = formKey;
        }

        return data;
    }

    /**
     * @param {Object} request
     * @param {Promise} params
     */
    function prepareRequest(request, params) {
        request.set('X-Requested-With', 'XMLHttpRequest');

        if (params.type) {
            request.type(params.type);

            if (params.type === 'json') {
                request.accept('json');
            }
        }

        // always try to parse response as json with fallback to raw text
        request.parse(function (response, text) {
            try {
                return JSON.parse(text);
            } catch (e) {
                if (params.dataType && params.dataType !== 'json' ||
                    params.type && params.type !== 'json'
                ) {
                    return text;
                }

                // fixed bug? of missing response in superagent library
                e.response = response;

                throw e;
            }
        });

        if (params.ok) {
            request.ok(params.ok);
        }

        $.active++;

        return request
            .on('response', function (response) {
                $.active--;
                onResponse(response, params);
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

            return prepareRequest(superagent.post(params.url).send(params.data), params);
        },

        /**
         * @param {Object} params
         * @return {Promise}
         */
        get: function (params) {
            params = prepareParams(params);

            return prepareRequest(superagent.get(params.url).query(params.data), params);
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
