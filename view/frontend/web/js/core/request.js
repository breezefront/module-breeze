/* global superagent breeze */
(function () {
    'use strict';

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
            params.error(error);
        }

        if (params.complete) {
            params.complete(error.response);
        }

        throw error;
    }

    /**
     * @param {Object} response
     * @return {Object}
     */
    function onSuccess(response, params) {
        if (params.success) {
            params.success(response);
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
        var formKey = breeze.cookies.get('form_key');

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

    window.breeze = window.breeze || {};
    window.breeze.request = {
        /**
         * @param {Object} params
         * @return {Promise}
         */
        post: function (params) {
            var request;

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

            request = superagent
                .post(params.url)
                .send(params.data)
                .set('X-Requested-With', 'XMLHttpRequest');

            if (params.ok) {
                request.ok(params.ok);
            } else if (params.strict !== false) {
                request.ok(function (response) {
                    return response.body;
                });
            }

            return request
                .on('response', function (response) {
                    onResponse(response, params);
                })
                .catch(function (error) {
                    return onError(error, params);
                })
                .then(function (response) {
                    return onSuccess(response, params);
                });
        },

        /**
         * @param {Object} params
         * @return {Promise}
         */
        get: function (params) {
            params = prepareParams(params);

            return superagent
                .get(params.url)
                .query(params.data)
                .set('X-Requested-With', 'XMLHttpRequest')
                .on('response', function (response) {
                    onResponse(response, params);
                })
                .catch(function (error) {
                    return onError(error, params);
                })
                .then(function (response) {
                    return onSuccess(response, params);
                });
        }
    };
})();
