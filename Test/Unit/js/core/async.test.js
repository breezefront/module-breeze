/**
 * @jest-environment jsdom
 */

// Мок jQuery/Zepto-подібного $
const $ = jest.fn(function(selector, context = document) {
    let elements = [];

    if (typeof selector === 'string') {
        const ctxElement = (context instanceof HTMLElement || context === document) ? context : document;
        if (ctxElement && ctxElement.querySelectorAll) {
            const foundNodes = ctxElement.querySelectorAll(selector);
            elements.push(...Array.from(foundNodes));
        } else if (selector === document && context === document) {
            elements.push(document);
        }
    } else if (selector instanceof HTMLElement || selector === document) {
        elements.push(selector);
    }

    const jQueryMock = {
        0: elements[0],
        length: elements.length,
        each: function(callback) {
            elements.forEach(el => callback.call(el));
            return this;
        },
        is: function(s) {
            if (elements.length === 0) return false;
            if (elements[0].matches) {
                return elements[0].matches(s);
            }
            return false;
        },
        on: function(event, handler) {
            if (!this._events) this._events = {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(handler);
        },
        trigger: function(event, data) {
            if (this._events && this._events[event]) {
                this._events[event].forEach(fn => fn(data));
            }
        }
    };

    return jQueryMock;
});

Object.assign($, {
    breezemap: {},
    _elements: {},
    _events: {},
    on: function(eventName, handler) {
        this._events[eventName] = this._events[eventName] || [];
        this._events[eventName].push(handler);
    },
    trigger: function(eventName, data) {
        if (this._events[eventName]) {
            this._events[eventName].forEach(handler => handler(data));
        }
    }
});

// Мок lodash-подібних функцій
const _ = {
    noop: () => {},
    isObject: (value) => typeof value === 'object' && value !== null,
    toArray: (list) => Array.from(list),
    chunk: (array, size) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },
    each: (collection, iteratee) => {
        if (Array.isArray(collection)) {
            collection.forEach(iteratee);
        } else if (typeof collection === 'object' && collection !== null) {
            for (const key in collection) {
                if (Object.prototype.hasOwnProperty.call(collection, key)) {
                    iteratee(collection[key], key);
                }
            }
        }
    }
};

if (typeof Node === 'undefined') {
    global.Node = {
        ELEMENT_NODE: 1
    };
}

const $document = {
    _events: {},
    is: () => false,
    each: (callback) => callback.call(document)
};
$document.on = $.on.bind($document);
$document.trigger = $.trigger.bind($document);

let currentObserverInstance;
let currentMapping;
let currentCounter;

function globalParseArguments(selector, ctx, callback) {
    if (_.isObject(selector)) {
        return {
            selector: selector.selector,
            ctx: selector.ctx || document,
            callback: ctx
        };
    }
    return {
        selector,
        ctx: callback ? ctx : document,
        callback: callback || ctx
    };
}

const reloadAsyncScript = () => {
    jest.resetModules();

    global.$ = $;
    global._ = _;

    // Ініціалізуємо $.breezemap та breeze перед завантаженням async.js
    $.breezemap = {};
    $.breeze = {};
    $.breeze.loadedScripts = {};
    $.breeze.preloadedScripts = {};
    $.breeze.jsconfig = {};
    $.breeze._initialized = true;

    global.window = global; // симулюємо window, якщо async/globals його використовує

    require('@breeze-module/view/frontend/web/js/core/async.js');
};

// --- Мок MutationObserver ---
beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    let observerCallback;

    global.MutationObserver = class {
        constructor(callback) {
            observerCallback = callback;
        }
        observe() {}
        disconnect() {}
        takeRecords() { return []; }
    };

    global.triggerMutation = (mutations) => {
        if (observerCallback) observerCallback(mutations, {});
    };

    reloadAsyncScript();

    // Очищаємо події
    $document._events = {};
});

describe('$.async (Refactored Version)', () => {
    let mockCallback;
    let mockElement;

    beforeEach(() => {
        document.body.innerHTML = '';

        mockCallback = jest.fn();
        mockElement = document.createElement('div');
        mockElement.id = 'test-div';
        delete mockElement._observeId;
        document.body.appendChild(mockElement);

        jest.spyOn(mockElement, 'matches').mockImplementation(selector => {
            return selector === '#test-div' || selector === 'div';
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('should trigger the callback for existing elements', () => {
        $.async('#test-div', mockCallback);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(mockElement);
    });

    it('should not trigger the callback multiple times for the same element', () => {
        $.async('#test-div', mockCallback);
        $.async('#test-div', mockCallback);
        expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should parse arguments when only selector and callback are provided', () => {
        const args = globalParseArguments('.my-selector', mockCallback);
        expect(args.selector).toBe('.my-selector');
        expect(args.ctx).toBe(document);
        expect(args.callback).toBe(mockCallback);
    });

    it('should parse arguments when selector, ctx, and callback are provided', () => {
        const customCtx = document.createElement('div');
        const args = globalParseArguments('.my-selector', customCtx, mockCallback);
        expect(args.selector).toBe('.my-selector');
        expect(args.ctx).toBe(customCtx);
        expect(args.callback).toBe(mockCallback);
    });

    it('should parse arguments when selector is an object', () => {
        const customCtx = document.createElement('div');
        const args = globalParseArguments({ selector: '.obj-selector', ctx: customCtx }, mockCallback);
        expect(args.selector).toBe('.obj-selector');
        expect(args.ctx).toBe(customCtx);
        expect(args.callback).toBe(mockCallback);
    });

    it('should trigger the callback when a matching element is added to the DOM', () => {
        jest.useFakeTimers();

        $.async('#dynamic-div', mockCallback);
        $document.trigger('breeze:beforeLoad');

        const dynamicDiv = document.createElement('div');
        dynamicDiv.id = 'dynamic-div';
        delete dynamicDiv._observeId;
        jest.spyOn(dynamicDiv, 'matches').mockImplementation(selector => {
            return selector === '#dynamic-div' || selector === 'div' || selector.includes('#dynamic-div');
        });

        expect(mockCallback).not.toHaveBeenCalled();

        document.body.appendChild(dynamicDiv);

        // Викликаємо MutationObserver callback вручну
        global.triggerMutation([{
            addedNodes: [dynamicDiv],
            type: 'childList',
            target: document.body,
        }]);

        jest.runAllTimers();

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(dynamicDiv);

        jest.useRealTimers();
    });

    it('should not trigger the callback for non-matching elements', () => {
        jest.useFakeTimers();
        $.async('#only-this-div', mockCallback);

        $document.trigger('breeze:beforeLoad');

        const nonMatchingDiv = document.createElement('span');
        document.body.appendChild(nonMatchingDiv);

        global.triggerMutation([{
            addedNodes: [nonMatchingDiv],
            type: 'childList',
            target: document.body,
        }]);

        jest.runAllTimers();

        expect(mockCallback).not.toHaveBeenCalled();
        jest.useRealTimers();
    });

    it('should not trigger the callback for SCRIPT tags', () => {
        jest.useFakeTimers();
        $.async('script', mockCallback);

        $document.trigger('breeze:beforeLoad');

        const scriptTag = document.createElement('script');
        scriptTag.src = 'test.js';
        document.body.appendChild(scriptTag);

        global.triggerMutation([{
            addedNodes: [scriptTag],
            type: 'childList',
            target: document.body,
        }]);

        jest.runAllTimers();

        expect(mockCallback).not.toHaveBeenCalled();
        jest.useRealTimers();
    });

    it('should trigger for nested matching elements', () => {
        jest.useFakeTimers();
        $.async('.nested-item', mockCallback);

        $document.trigger('breeze:beforeLoad');

        const parentDiv = document.createElement('div');
        const nestedSpan1 = document.createElement('span');
        nestedSpan1.className = 'nested-item';
        const nestedSpan2 = document.createElement('span');
        nestedSpan2.className = 'nested-item';

        parentDiv.appendChild(nestedSpan1);
        parentDiv.appendChild(nestedSpan2);
        document.body.appendChild(parentDiv);

        jest.spyOn(nestedSpan1, 'matches').mockImplementation(selector =>
            selector === '.nested-item' || selector === 'span' || selector.includes('.nested-item'));
        jest.spyOn(nestedSpan2, 'matches').mockImplementation(selector =>
            selector === '.nested-item' || selector === 'span' || selector.includes('.nested-item'));

        global.triggerMutation([{
            addedNodes: [parentDiv],
            type: 'childList',
            target: document.body,
        }]);

        jest.runAllTimers();

        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(mockCallback).toHaveBeenCalledWith(nestedSpan1);
        expect(mockCallback).toHaveBeenCalledWith(nestedSpan2);

        jest.useRealTimers();
    });

    it('should not trigger the callback after it is removed with .off()', () => {
        // 1. Додаємо callback
        $.async('#dynamic', mockCallback);

        // 2. Відписуємося
        $.async.off('#dynamic', mockCallback);

        // 3. Тригеримо додавання
        const div = document.createElement('div');
        div.id = 'dynamic';
        document.body.appendChild(div);

        $document.trigger('breeze:beforeLoad');
        jest.runAllTimers();

        // 4. Очікуємо: callback НЕ викликано
        expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should only remove the exact matching listener', () => {
        jest.useFakeTimers();
        document.body.innerHTML = '';

        const cb1 = jest.fn();
        const cb2 = jest.fn();

        $.async('#test-div', cb1);
        $.async('#test-div', cb2);

        $.async.off('#test-div', cb1);

        const el = document.createElement('div');
        el.id = 'test-div';
        document.body.appendChild(el);

        jest.spyOn(el, 'matches').mockImplementation(selector => {
            return selector === '#test-div' || selector === 'div' || selector.includes('#test-div');
        });

        $document.trigger('breeze:beforeLoad');
        global.triggerMutation([{
            addedNodes: [el],
            type: 'childList',
            target: document.body,
        }]);
        jest.runAllTimers();

        expect(cb1).not.toHaveBeenCalled();
        expect(cb2).toHaveBeenCalledTimes(1);

        document.body.removeChild(el);
    });
});
