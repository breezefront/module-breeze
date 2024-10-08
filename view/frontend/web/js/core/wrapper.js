define([
    'underscore'
], function (_) {
    'use strict';

    var superReg = /\b_super\b/;

    $.breezemap['mage/utils/wrapper'] = {
        wrap: function (target, wrapper) {
            if (!_.isFunction(target) || !_.isFunction(wrapper)) {
                return wrapper;
            }

            return function () {
                var args = _.toArray(arguments),
                    ctx = this,
                    _super;

                _super = function () {
                    // preserve args when calling _super() without arguments
                    return target.apply(ctx, arguments.length ? arguments : args.slice(1));
                };

                args.unshift(_super);

                return wrapper.apply(ctx, args);
            };
        },

        wrapSuper: function (target, wrapper) {
            if (!this.hasSuper(wrapper) || !_.isFunction(target)) {
                return wrapper;
            }

            return function () {
                var _super = this._super,
                    args = arguments,
                    result;

                this._super = function () {
                    // preserve args when calling _super() without arguments
                    return target.apply(this, arguments.length ? arguments : args);
                };

                result = wrapper.apply(this, args);

                this._super = _super;

                return result;
            };
        },

        hasSuper: function (fn) {
            return _.isFunction(fn) && superReg.test(fn);
        },

        extend: function (target) {
            var extenders = _.toArray(arguments).slice(1),
                iterator = this._extend.bind(this, target);

            extenders.forEach(iterator);

            return target;
        },

        _extend: function (target, extender) {
            _.each(extender, function (value, key) {
                target[key] = this.wrap(target[key], extender[key]);
            }, this);
        }
    };
});
