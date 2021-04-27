/* Simple JavaScript Inheritance
 * By John Resig https://johnresig.com/
 * Inspired by base2 and Prototype
 * MIT Licensed.
 */
(function () {
    var initializing = false,
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

        for (name in prop) {
            propType = typeof prop[name];
            superPropType = typeof _super[name];

            if (propType === 'function' && superPropType === 'function' && fnTest.test(prop[name])) {
                prototype[name] = (function (name, fn) {
                    return function () {
                        var tmp = this._super,
                            ret;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        ret = fn.apply(this, arguments);

                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]);
            } else if (propType === 'object' && superPropType === 'object') {
                prototype[name] = $.extend(true, _super[name], prop[name]);
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
        Class.extend = arguments.callee;

        return Class;
    };
})();
