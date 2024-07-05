/* Simple JavaScript Inheritance
 * By John Resig https://johnresig.com/
 * Inspired by base2 and Prototype
 * MIT Licensed.
 */
// eslint-disable-next-line strict
(function () {
    var initializing = false,
        // eslint-disable-next-line no-undef
        fnTest = /xyz/.test(function () {xyz;}) ? /\b_super\b/ : /.*/;

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
                            args = arguments,
                            ret;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = function () {
                            return _super[key].apply(this, arguments.length ? arguments : args);
                        };

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        ret = fn.apply(this, args);

                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]);
            } else if (propType === 'object' && superPropType === 'object') {
                prototype[name] = $.extendProps(prop[name], _super[name]);
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
