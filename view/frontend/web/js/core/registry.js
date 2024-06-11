$.registry = (function () {
    'use strict';

    var data = {},
        scopeToName = {};

    function toName(name) {
        if (data[name]) {
            return name;
        }
        return scopeToName[name] || name;
    }

    return {
        first: function (name) {
            return this.get(name)[0];
        },

        /**
         * @param {String} name
         * @param {Element} element
         * @return {Mixed}
         */
        get: function (name, element) {
            var result = [];

            name = toName(name);

            if (!data[name] || !data[name].objects) {
                return data[name];
            }

            if (element) {
                return data[name].objects.get(element);
            }

            $.each(data[name].elements, function (index, el) {
                var instance = $.registry.get(name, el);

                if (!instance) {
                    return;
                }

                result.push(instance);
            });

            return result;
        },

        /**
         * @param {String} name
         * @param {Element} element
         * @param {Object} component
         */
        set: function (name, element, component) {
            if (!data[name] && component) {
                data[name] = {
                    objects: new WeakMap(),
                    elements: []
                };
            }

            if (!component) {
                component = element;
                element = false;
            }

            if (component.__scope) {
                $.breezemap.uiRegistry.set(component.__scope, component);
                scopeToName[component.__scope] = name;
            }

            if (!element) {
                data[name] = component;
            } else {
                data[name].objects.set(element || document.body, component);
                data[name].elements.push(element || document.body);
            }
        },

        /**
         * @param {String} name
         * @param {Element} element
         */
        delete: function (name, element, skipDestroy) {
            var instance, index;

            if (name && element) {
                name = toName(name);

                if (!data[name]) {
                    return;
                }

                instance = data[name].objects.get(element);
                index = data[name].elements.indexOf(element);

                if (index !== -1) {
                    data[name].elements.splice(index, 1);
                }

                if (instance?.destroy && !skipDestroy) {
                    instance.destroy();
                }

                if (instance?.__scope) {
                    $.breezemap.uiRegistry.remove(instance.__scope);
                }

                return data[name].objects.delete(element);
            }

            if (name) {
                return $.each(data[name].elements, function (i, el) {
                    $.registry.delete(name, el);
                });
            }

            $.each(data, function (t) {
                $.each(data[t].elements || [], function (i, el) {
                    $.registry.delete(t, el);
                });
            });

            $.breezemap.uiRegistry.removeAll();
        }
    };
})();

// Copy of Magento/Ui/view/base/web/js/lib/registry/registry.js
$.breezemap.uiRegistry = (() => {
    'use strict';

    var privateData = new WeakMap();

    function getItems(container) {
        return privateData.get(container).items;
    }

    function getRequests(container) {
        return privateData.get(container).requests;
    }

    function async(name, registry, method) {
        var args = _.toArray(arguments).slice(3);

        if (_.isString(method)) {
            registry.get(name, function (component) {
                component[method].apply(component, args);
            });
        } else if (_.isFunction(method)) {
            registry.get(name, method);
        } else if (!args.length) {
            return registry.get(name);
        }
    }

    function compare(query, target) {
        var matches = true,
            index,
            keys,
            key;

        if (!_.isObject(query) || !_.isObject(target)) {
            return false;
        }

        keys = Object.getOwnPropertyNames(query);
        index = keys.length;

        while (matches && index--) {
            key = keys[index];

            /* eslint-disable eqeqeq */
            if (target[key] != query[key]) {
                matches = false;
            }

            /* eslint-enable eqeqeq */
        }

        return matches;
    }

    function explode(query) {
        var result = {},
            index,
            data;

        if (typeof query !== 'string' || !~query.indexOf('=')) {
            return query;
        }

        query = query.split(',');
        index = query.length;

        while (index--) {
            data = query[index].split('=');

            result[data[0].trim()] = data[1].trim();
        }

        return result;
    }

    function find(data, query, findAll) {
        var iterator,
            item;

        query = explode(query);

        if (typeof query === 'string') {
            item = data[query];

            if (findAll) {
                return item ? [item] : [];
            }

            return item;
        }

        iterator = !_.isFunction(query) ?
            compare.bind(null, query) :
            query;

        return findAll ?
            _.filter(data, iterator) :
            _.find(data, iterator);
    }

    function Registry() {
        var data = {
            items: {},
            requests: []
        };

        this._updateRequests = _.debounce(this._updateRequests.bind(this), 10);
        privateData.set(this, data);
    }

    Registry.prototype = {
        constructor: Registry,

        get: function (query, callback) {
            if (typeof callback !== 'function') {
                return find(getItems(this), query);
            }

            this._addRequest(query, callback);
        },

        set: function (id, item) {
            getItems(this)[id] = item;

            this._updateRequests();

            return this;
        },

        remove: function (id) {
            delete getItems(this)[id];

            return this;
        },

        removeAll: function () {
            privateData.get(this).items = {};
            privateData.get(this).requests = [];
        },

        filter: function (query) {
            return find(getItems(this), query, true);
        },

        has: function (query) {
            return !!this.get(query);
        },

        contains: function (item) {
            return _.contains(getItems(this), item);
        },

        indexOf: function (item) {
            return _.findKey(getItems(this), function (elem) {
                return item === elem;
            });
        },

        promise: function (query) {
            return new Promise(resolve => {
                this.get(query, resolve);
            });
        },

        async: function (query) {
            return async.bind(null, query, this);
        },

        create: function () {
            return new Registry;
        },

        _addRequest: function (queries, callback) {
            var request;

            if (!Array.isArray(queries)) {
                queries = queries ? [queries] : [];
            }

            request = {
                queries: queries.map(explode),
                callback: callback
            };

            this._canResolve(request) ?
                this._resolveRequest(request) :
                getRequests(this).push(request);

            return this;
        },

        _updateRequests: function () {
            getRequests(this)
                .filter(this._canResolve, this)
                .forEach(this._resolveRequest, this);

            return this;
        },

        _resolveRequest: function (request) {
            var requests = getRequests(this),
                items    = request.queries.map(this.get, this),
                index    = requests.indexOf(request);

            request.callback.apply(null, items);

            if (~index) {
                requests.splice(index, 1);
            }

            return this;
        },

        _canResolve: function (request) {
            var queries = request.queries;

            return queries.every(this.has, this);
        }
    };

    return new Registry;
})();
