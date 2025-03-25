/* Simple JavaScript Inheritance
 * By John Resig https://johnresig.com/
 * Inspired by base2 and Prototype
 * MIT Licensed.
 */
// eslint-disable-next-line strict
define(['mage/utils/wrapper'], function (wrapper) {
    var initializing = false;

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

            if (propType === 'function' && superPropType === 'function') {
                prototype[name] = wrapper.wrapSuper(_super[name], prop[name]);
            } else if (propType === 'object' && superPropType === 'object') {
                prototype[name] = $.extendProps(prop[name], _super[name]);
            } else {
                prototype[name] = prop[name];
            }
        }

        /** The dummy class constructor */
        function Class() {
            var obj = this;

            if (!obj || Object.getPrototypeOf(obj) !== Class.prototype) {
                obj = Object.create(Class.prototype);
            }

            if (!initializing && obj._initialize) {
                obj._initialize.apply(obj, arguments);
            }

            return obj;
        }

        Class.prototype = prototype;
        Class.prototype.constructor = Class;
        // eslint-disable-next-line no-caller
        Class.extend = arguments.callee;

        return Class;
    };
});
