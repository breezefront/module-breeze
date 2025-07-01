console.log('✅ jest.setup.js loaded');

const docTrigger = jest.fn();
const docOn = jest.fn();

global.document = {
    currentScript: {
        src: 'http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/core.min.js',
        dataset: { name: 'test-script' }
    },
    trigger: docTrigger,
    on: docOn,
};

// Мінімальний мок для cash, який підтримує потрібні методи Breeze
function createCashMock(selector) {
    // Об'єкт, що підтримує chainable API cash
    const mock = {
        trigger: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        addClass: jest.fn().mockReturnThis(),
        removeClass: jest.fn().mockReturnThis(),
        data: jest.fn(),
        html: jest.fn(),
        length: 1,
        filter: jest.fn().mockReturnThis(),
        first: jest.fn().mockReturnThis(),
        attr: jest.fn(),
    };

    if (typeof selector === 'string') {
        if (selector.includes('script[src*="/Swissup_Breeze/bundles/"]')) {
            mock.attr.mockReturnValue(
                'http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/bundles/1/bundle.min.js'
            );
        } else if (
            selector.includes('script[src*="/Swissup_Breeze/"]') &&
            (selector.includes('/core.') || selector.includes('/main.'))
        ) {
            mock.attr.mockReturnValue(
                'http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/core.min.js'
            );
        } else if (selector.startsWith('#')) {
            mock.html.mockReturnValue('<div>Hello</div>');
        } else {
            // Для інших селекторів повертати "порожній" мок
            mock.length = 0;
        }
    } else if (selector === global.document) {
        // Особливий мок для document
        mock.trigger = (...args) => docTrigger(...args);
        mock.on = (...args) => docOn(...args);
    }

    return mock;
}

global.cash = jest.fn(createCashMock);

// cash.extend для копіювання властивостей (аналог $.extend)
global.cash.extend = jest.fn((deep, target, ...sources) => {
    const result = { ...target };
    for (const source of sources) {
        for (const key in source) {
            if (
                deep &&
                typeof result[key] === 'object' && result[key] !== null &&
                typeof source[key] === 'object' && source[key] !== null &&
                !Array.isArray(result[key]) && !Array.isArray(source[key])
            ) {
                result[key] = global.cash.extend(true, result[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    return result;
});

global.cash.guid = 0;
global.cash.preloadScript = jest.fn().mockResolvedValue(true);
global.cash.loadScript = jest.fn().mockResolvedValue(true);
global.cash.get = jest.fn().mockResolvedValue({ body: 'mock content' });

global.cash.breeze = {
    jsconfig: {},
    jsignore: []
};

global.cash.breezemap = {
    __counter: 1,
    __aliases: {},
    __getAll: function () { return {}; },
    __get: function (key) { return this[key]; },
    __lastComponent: function () { return null; },
    __register: function (name, module) { this[name] = module; },
};

global.cash.mixin = jest.fn();
global.cash.mixin.pending = {};

global.window = {
    VIEW_URL: 'http://test.com',
    location: {
        search: '',
        hash: ''
    },
    require: jest.fn((deps, callback) => {
        if (typeof callback === 'function') {
            callback('mockResult');
        }
    }),
    define: undefined,
    requirejs: undefined,
    globalVar: undefined,
    required: undefined,
    setTimeout: jest.fn((fn, delay) => setTimeout(fn, delay)),
};

global._ = {
    isArray: Array.isArray,
    isObject: val => typeof val === 'object' && val !== null,
    isNumber: val => typeof val === 'number',
    range: (start, end) => Array.from({ length: end - start }, (_, i) => start + i),
    get: (obj, path) => {
        if (!obj || !path) return undefined;
        const pathParts = typeof path === 'string' ? path.split('.') : path;
        let current = obj;
        for (const part of pathParts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return current;
    },
    isEmpty: obj => !obj || Object.keys(obj).length === 0,
};

global.console = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    groupCollapsed: jest.fn(),
    groupEnd: jest.fn()
};

global.window.BASE_URL = 'http://test.com/';
