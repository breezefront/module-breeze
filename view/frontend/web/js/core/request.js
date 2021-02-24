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

    window.breeze = window.breeze || {};
    window.breeze.request = {
        /**
         * @param {Object} params
         * @return {Promise}
         */
        post: function (params) {
            if (params.data instanceof FormData && !params.data.has('form_key')) {
                params.data.set('form_key', breeze.cookies.get('form_key'));
            } else if (params.data && !params.data.form_key) {
                params.data.form_key = breeze.cookies.get('form_key');
            }

            return superagent
                .post(params.url)
                .send(params.data)
                .set('X-Requested-With', 'XMLHttpRequest')
                .ok(function (response) {
                    return response.body;
                })
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
