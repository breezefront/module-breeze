// Test/Unit/js/core/define/define-loader.test.js
const fs = require('fs');
const path = require('path');

// Явно підключаємо глобальні моки
require('../../../../jest.setup.js');

describe('ModuleLoader', () => {
    beforeAll(() => {
        global.window = global.window || {};
        global.window.document = global.document;

        global.$ = global.$ || jest.fn();
        global.window.$ = global.$;

        global.$.extend = (...args) => Object.assign(...args);

        global.$.breezemap = {
            __counter: 1,
            __aliases: {},
            __getAll: () => ({}),
            __get: () => {},
            __lastComponent: () => null,
            __register: () => {}
        };

        // Моки для асинхронних методів, щоб вони не чекали реального завантаження
        global.$.preloadScript = jest.fn(() => Promise.resolve());
        global.$.loadScript = jest.fn(() => Promise.resolve());

        const filePath = path.resolve(
            __dirname,
            '../../../../../view/frontend/web/js/core/define.js'
        );
        const code = fs.readFileSync(filePath, 'utf8');
        eval(code);
    });

    it('should define window.require and window.define', () => {
        expect(typeof window.require).toBe('function');
        expect(typeof window.define).toBe('function');
    });

    it('should create a module by name', (done) => {
        window.define('my/module', [], () => 'test');
        window.require(['my/module'], (result) => {
            expect(result).toBe('test');
            done();
        });
    }, 10000);

    it('should define and run a module with dependencies', (done) => {
        window.define('dep1', [], () => 'result from dep1');
        window.define('mainmod', ['dep1'], (dep1) => `hello ${dep1}`);
        window.require(['mainmod'], (result) => {
            expect(result).toBe('hello result from dep1');
            done();
        });
    }, 10000);
});
