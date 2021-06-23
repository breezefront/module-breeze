/* Simple JavaScript Inheritance
 * By John Resig https://johnresig.com/
 * Inspired by base2 and Prototype
 * MIT Licensed.
 */
/* global _ */
// eslint-disable-next-line strict
(function () {
    var initializing = false,
        // eslint-disable-next-line no-undef
        fnTest = /xyz/.test(function () {xyz;}) ? /\b_super\b/ : /.*/;

    /**
     * Create new object with extended props.
     * Objects are extended, arrays are overwritten.
     *
     * @param {Object} parent
     * @param {Object} self
     * @return {Object}
     */
    function recursiveExtend(parent, self) {
        var destination = {};

        $.each(self, function (key, value) {
            if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value)) {
                destination[key] = recursiveExtend(parent[key] || {}, self[key]);
            } else {
                destination[key] = value;
            }
        });

        $.each(parent, function (key, value) {
            if (typeof self[key] !== 'undefined') {
                return;
            }

            if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value)) {
                destination[key] = recursiveExtend(parent[key], self[key] || {});
            } else {
                destination[key] = value;
            }
        });

        return destination;
    }

    this.Class = function () {};

    Class.extend = function (prop) {
        var _super = this.prototype,
            prototype,
            name,
            superPropType,
            propType;

        initializing = true;
        prototype = new this();
        initializing = false;

        // eslint-disable-next-line guard-for-in
        for (name in prop) {
            propType = typeof prop[name];
            superPropType = typeof _super[name];

            if (propType === 'function' && superPropType === 'function' && fnTest.test(prop[name])) {
                prototype[name] = (function (key, fn) {
                    return function () {
                        var tmp = this._super,
                            ret;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[key];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        ret = fn.apply(this, arguments);

                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]);
            } else if (propType === 'object' && superPropType === 'object') {
                prototype[name] = recursiveExtend(_super[name], prop[name]);
            } else {
                prototype[name] = prop[name];
            }
        }

        /** The dummy class constructor */
        function Class() {
            if (!initializing && this._initialize) {
                this._initialize.apply(this, arguments);
            }
        }

        Class.prototype = prototype;
        Class.prototype.constructor = Class;
        // eslint-disable-next-line no-caller
        Class.extend = arguments.callee;

        return Class;
    };
})();
