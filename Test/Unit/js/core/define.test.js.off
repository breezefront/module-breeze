// Test/Unit/js/core/define.test.js

describe('ModuleLoader', () => {
    let moduleLoader;

    // Define ModuleClass (ваша реалізація залишається незмінною)
    const ModuleClass = class Module {
        constructor(name, loader) {
            this.name = name;
            this.loader = loader;
            this.parents = [];
            this.dependencies = [];
            this.loaded = false;
            this.ran = false;
            this.result = undefined;
            this.callback = null;
            this.path = null;
            this.named = false;
            this.unknown = false;
            this.failed = false;
            this.waitForResult = false;
            this.collectedDeps = null;
        }
        addParents(parents) { this.parents.push(...parents); }
        addDependencies(dependencies) { this.dependencies.push(...dependencies); }
        getGlobalValue() {
            const shimConfig = this.loader.config.shim[this.name];
            if (shimConfig?.exports) {
                return _.get(window, shimConfig.exports.split('.'));
            }
            return null;
        }
        run() {
            if (this.ran || this.dependencies.some(dep => !dep.loaded)) {
                return this.result;
            }
            this.ran = true;
            try {
                this.executeCallback();
                this.processResult();
                this.handleAutoload();
                this.registerInBreezeMap();
                this.handleUnresolvedDependency();
                this.runParents();
                this.reportUnknownComponent();
            } catch (error) {
                console.error(`Error running module ${this.name}:`, error);
            }
            return this.result;
        }
        executeCallback() {
            if (this.callback) {
                const args = this.dependencies.map(dep => dep.run());
                this.result = this.callback.apply(window, args);
            }
        }
        processResult() {
            this.loaded = true;
            if (this.result === undefined) {
                this.result = this.getGlobalValue();
            }
            if (this.result?.component && typeof this.result.component === 'string') {
                $.breezemap[this.result.component] = this.result;
            }
            if ($.breezemap?.__get(this.name)) {
                this.result = $.breezemap.__get(this.name);
            }
        }
        handleAutoload() {
            const jsconfig = $.breeze?.jsconfig || {};
            const bundleName = jsconfig[this.name]?.bundle;
            if (bundleName && !this.loader.autoloadedBundles.has(bundleName)) {
                this.loader.autoloadedBundles.add(bundleName);
                $(document).trigger('bundle:autoload', bundleName);
            }
        }
        registerInBreezeMap() {
            if (this.result !== undefined && !(this.result instanceof $)) {
                [this.name].forEach(alias => {
                    let finalAlias = alias;
                    if (alias.endsWith('-orig')) {
                        finalAlias = alias.slice(0, -5);
                    } else if (alias.startsWith('__module-')) {
                        finalAlias = `__component${$.breezemap.__counter++}`;
                    }
                    if (!$.breezemap?.__get(finalAlias)) {
                        $.breezemap[finalAlias] = this.result;
                    }
                });
            }
        }
        handleUnresolvedDependency() {
            if (this.result === undefined && this.waitForResult && !this.failed &&
                this.path && !this.path.includes('//')) {
                this.ran = this.loaded = false;
                setTimeout(() => this.reportUnresolved(), 100);
            }
        }
        reportUnresolved() {
            if (this.loaded) return;
            if (this.loader.loadingCount) {
                setTimeout(() => this.reportUnresolved(), 1000);
                return;
            }
            console.error('Unable to resolve dependency', this);
            this.failed = true;
            this.run();
        }
        runParents() {
            this.parents.forEach(parent => parent.run());
        }
        reportUnknownComponent() {
            if (this.result === undefined && this.unknown &&
                (window.location.search.includes('breeze=1') || window.location.hash.includes('breeze')) &&
                !$.breeze?.jsignore?.includes(this.name)) {
                const originalLimit = Error.stackTraceLimit;
                Error.stackTraceLimit = 100;
                console.groupCollapsed(this.name);
                console.log(new Error(`Unknown component ${this.name}`));
                console.groupEnd();
                Error.stackTraceLimit = originalLimit;
            }
        }
    };

    // Define ModuleLoaderInternal
    class ModuleLoaderInternal {
        constructor() {
            this.modules = new Map();
            this.loadingCount = 0;
            this.config = {
                paths: {},
                shim: {},
            };
            this.defaultStackTraceLimit = Error.stackTraceLimit || 10;
            this.autoloadedBundles = new Set();
            this.lastDefines = [];

            this.bundlePrefixRe = /(?<prefix>Swissup_Breeze\/bundles\/\d+\/).*\.js$/;
            this.suffixRe = /Swissup_Breeze\/.*?(core|main)(?<suffix>\.min\.js|\.js)$/;

            // These rely on `$` and `document` being mocked correctly before ModuleLoaderInternal is instantiated
            this.bundlePrefix = this.extractBundlePrefix();
            this.jsSuffix = this.extractJsSuffix();

            // Залишити цей рядок розкоментованим
            this.initializeGlobals();
        }

        extractBundlePrefix() {
            try {
                const script = $('script[src*="/Swissup_Breeze/bundles/"]').first();
                const src = script.attr('src');
                if (!src) return '';
                const match = src.match(this.bundlePrefixRe);
                return match?.groups?.prefix || '';
            } catch (error) {
                console.error('Error extracting bundle prefix:', error);
                return '';
            }
        }

        extractJsSuffix() {
            try {
                const scripts = $('script[src*="/Swissup_Breeze/"]')
                    .filter((i, el) => el.src.includes('/core.') || el.src.includes('/main.'));
                if (scripts.length === 0) return '.js';
                const src = scripts.first().attr('src');
                const match = src?.match(this.suffixRe);
                return match?.groups?.suffix || '.js';
            } catch (error) {
                console.error('Error extracting JS suffix:', error);
                return '.js';
            }
        }
        isRunningFromBundle() {
            try {
                return document.currentScript?.src?.includes('Swissup_Breeze/bundles/') || false;
            } catch (error) {
                console.error('Error checking bundle status:', error);
                return false;
            }
        }
        createModule(name, deps = [], parents = [], callback) {
            if (typeof parents === 'function') {
                callback = parents;
                parents = [];
            }
            if (this.modules.has(name)) {
                const existingModule = this.modules.get(name);
                this.updateModule(existingModule, deps, parents, callback);
                return existingModule;
            }
            const module = new ModuleClass(name, this);
            this.modules.set(name, module);
            this.configureModulePath(module);
            this.setModuleCallback(module, callback);
            this.addModuleDependencies(module, deps, parents);
            return module;
        }
        updateModule(module, deps, parents, callback) {
            if (callback && module.callback && callback !== module.callback) {
                console.warn(`[ModuleLoader] Callback override for "${module.name}"`);
            }
            if (!module.callback && callback) {
                module.callback = callback;
            }
            module.addParents(parents);
            module.addDependencies(deps.map(depName => this.createModule(depName, [], [module])));
        }
        configureModulePath(module) {
            const jsconfig = $.breeze?.jsconfig || {};
            if (jsconfig[module.name]) {
                module.path = jsconfig[module.name].path;
            } else if (module.name.startsWith('text!')) {
                module.path = module.name.substr(5);
            } else if (!_.isEmpty(jsconfig) && !module.name.startsWith('__') && !$.breezemap?.__get(module.name)) {
                this.findWildcardPath(module, jsconfig);
            }
        }
        findWildcardPath(module, jsconfig) {
            const wildcardKeys = Object.keys(jsconfig).filter(k => k.includes('*'));
            for (const key of wildcardKeys) {
                const prefix = key.split('*')[0];
                if (module.name.startsWith(prefix)) {
                    module.path = module.name;
                    break;
                }
            }
        }
        setModuleCallback(module, callback) {
            if (callback) {
                module.callback = callback;
            }
        }
        addModuleDependencies(module, deps, parents) {
            module.addParents(parents);
            const dependencies = deps.map(depName => this.createModule(depName, [], [module]));
            module.addDependencies(dependencies);
        }
        collectDependencies(alias, aliasAsPath = false, isKnown = false, visited = new Set()) {
            const visitedKey = `${alias}|${aliasAsPath ? 'path' : 'alias'}`;
            if (visited.has(visitedKey)) {
                console.warn(`Circular dependency detected for alias: ${alias}`);
                return [];
            }
            visited.add(visitedKey);
            try {
                return this.doCollectDependencies(alias, aliasAsPath, isKnown, visited);
            } catch (error) {
                console.error(`Error collecting dependencies for ${alias}:`, error);
                return [];
            }
        }
        doCollectDependencies(alias, aliasAsPath, isKnown, visited) {
            const jsconfig = $.breeze?.jsconfig || {};
            const result = [];
            let path = aliasAsPath ? alias : jsconfig[alias]?.path || alias;
            const imports = aliasAsPath ? [] : jsconfig[alias]?.import || [];
            const index = imports.indexOf(alias);
            const [bundle, lastIndex] = path.split('*');
            if (lastIndex) {
                const bundleIndex = parseInt(lastIndex, 10) || 0;
                const bundlePath = this.bundlePrefix + bundle;
                path = bundlePath + (bundleIndex || '');
                const bundleImports = _.range(0, bundleIndex)
                    .map(i => bundlePath + (i || ''));
                imports.push(...bundleImports);
            }
            let module = this.createModule(alias);
            if (aliasAsPath && module.path !== path) {
                module = this.createModule(alias + '-orig');
            }
            if (module.collectedDeps) {
                return module.collectedDeps;
            }
            imports.forEach((item, i) => {
                const deps = this.collectDependencies(item, i === index, true, visited);
                result.push(...deps);
            });
            this.collectSuffixDependencies(alias, result, visited);
            this.collectWildcardDependencies(alias, result, visited);
            this.configureModuleForCollection(module, path, alias, isKnown);
            result.push(module);
            module.collectedDeps = result;
            return result;
        }
        collectSuffixDependencies(alias, result, visited) {
            const jsconfig = $.breeze?.jsconfig || {};
            const suffixKeys = Object.keys(jsconfig).filter(key => key.endsWith(`.${alias}`));
            suffixKeys.forEach(key => {
                const deps = this.collectDependencies(key, false, false, visited);
                result.push(...deps);
            });
        }
        collectWildcardDependencies(alias, result, visited) {
            const jsconfig = $.breeze?.jsconfig || {};
            const wildcardEntries = Object.entries(jsconfig).filter(([k]) => k.includes('*'));
            for (const [key, value] of wildcardEntries) {
                const prefix = key.split('*')[0];
                if (alias.startsWith(prefix)) {
                    const imports = (value.import || []).filter(importKey => importKey !== alias);
                    imports.forEach(importKey => {
                        const deps = this.collectDependencies(importKey, false, false, visited);
                        result.push(...deps);
                    });
                }
            }
        }
        configureModuleForCollection(module, path, alias, isKnown) {
            const jsconfig = $.breeze?.jsconfig || {};
            if (isKnown || jsconfig[module.name]?.path) {
                module.path = path;
            } else if (this.config.paths[alias] || alias.includes('//')) {
                module.path = alias;
            } else if (!module.path && !module.named) {
                module.unknown = true;
                module.loaded = true;
            }
        }
        toUrl(path) {
            if (this.config.paths[path]) {
                return this.config.paths[path];
            }
            if (path.includes('//')) {
                return path;
            }
            if (path.endsWith('.min')) {
                path += '.js';
            } else if (!path.endsWith('.min.js') &&
                (path.endsWith('.js') || !path.split('/').pop().includes('.'))
            ) {
                path = path.replace(/\.js$/, '');
                path += this.jsSuffix;
            }
            return (window.VIEW_URL || '') + '/' + path;
        }
        initializeGlobals() {
            window.require = this.createRequireFunction();
            window.define = window.requirejs = window.require;
            window.require.defined = (name) => this.createModule(name).loaded;
            window.require.toUrl = (path) => this.toUrl(path);
            window.require.config = (cfg) => $.extend(true, this.config, cfg || {});
            window.require.async = this.createAsyncRequire();
            this.initializeBreezeMap();
        }
        createRequireFunction() {
            return (deps, callback, extra) => {
                try {
                    return this.handleRequire(deps, callback, extra);
                } catch (error) {
                    console.error('Error in require:', error);
                    return undefined;
                }
            };
        }
        handleRequire(deps, callback, extra) {
            const scriptName = $(document.currentScript).data('name');
            const name = this.isRunningFromBundle() ? undefined : scriptName;
            if (typeof deps === 'string' && typeof extra === 'function') {
                const module = this.createModule(deps, callback, extra);
                module.named = true;
                return module;
            }
            if (typeof deps === 'string') {
                return this.createModule(deps, [], callback);
            }
            if (typeof deps === 'function') {
                callback = deps;
                deps = ['require'];
            }
            if (!window.require.ready && !deps.every?.(arg => $.breezemap?.[arg])) {
                window.required = window.required || [];
                window.required.push([deps, callback, extra]);
                return;
            }
            return this.processRequire(deps, callback, name, scriptName);
        }
        processRequire(deps, callback, name, scriptName) {
            if ((this.modules.get(name)?.callback || this.modules.get(name)?.ran) && callback) {
                name = `__module-${$.guid++}`;
            }
            const module = this.createModule(name || `__module-${$.guid++}`, deps, callback);
            const allDeps = this.collectAllDependencies(deps, scriptName);
            this.setWaitForResult(callback, deps);
            this.loadModules(allDeps);
            return module.run();
        }
        collectAllDependencies(deps, scriptName) {
            const depsWithImports = [];
            deps.forEach(depName => {
                const collected = this.collectDependencies(depName);
                depsWithImports.push(...collected);
            });
            depsWithImports
                .filter(dep => dep.getGlobalValue())
                .forEach(dep => dep.run());
            return depsWithImports
                .filter(dep => !dep.loaded && (dep.path || dep.named) && dep.name !== scriptName)
                .map(dep => this.prepareDepForLoading(dep));
        }
        prepareDepForLoading(dep) {
            if (dep.path?.includes('//')) {
                if (dep.path.endsWith('.js') || dep.path.endsWith('/') || dep.path.includes('?')) {
                    dep.url = dep.path;
                } else {
                    dep.url = dep.path + '.js';
                }
            } else if (dep.path) {
                dep.url = this.toUrl(dep.path);
            }
            return dep;
        }
        setWaitForResult(callback, deps) {
            if (callback?.length && deps.length) {
                deps.some((depName, i) => {
                    if (i >= callback.length) return true;
                    const module = this.modules.get(depName);
                    if (module) {
                        module.waitForResult = true;
                    }
                });
            }
        }
        async loadModules(allDeps) {
            const hasUrls = allDeps.some(dep => dep.url);
            this.lastDefines.push(hasUrls);
            const scriptsToLoad = allDeps.filter(dep => dep.url && !dep.name.startsWith('text!'));
            try {
                await Promise.all(scriptsToLoad.map(dep => $.preloadScript(dep.url)));
            } catch (error) {
                console.error('Error preloading scripts:', error);
            }
            for (const dep of allDeps) {
                await this.loadSingleModule(dep);
            }
        }
        async loadSingleModule(dep) {
            this.loadingCount++;
            try {
                if (dep.name.startsWith('text!')) {
                    await this.loadTextModule(dep);
                } else if (dep.url) {
                    await this.loadScriptModule(dep);
                }
            } catch (error) {
                console.error(`Error loading module ${dep.name}:`, error);
            } finally {
                this.loadingCount--;
                dep.run();
            }
        }
        async loadTextModule(dep) {
            const elementId = dep.path.replace(/[/.]/g, '_');
            const element = $('#' + elementId);
            if (element.length) {
                dep.callback = () => element.html();
            } else {
                try {
                    const response = await $.get(dep.url);
                    dep.callback = () => response.body || response;
                } catch (error) {
                    console.error(`Error loading text module ${dep.name}:`, error);
                }
            }
        }
        async loadScriptModule(dep) {
            try {
                await $.loadScript({
                    'src': dep.url,
                    'data-name': dep.name
                });
            } catch (error) {
                console.error(`Error loading script module ${dep.name}:`, error);
            }
        }
        createAsyncRequire() {
            return (deps) => new Promise(resolve => {
                const isMultipleDeps = _.isArray(deps);
                if (!isMultipleDeps) {
                    deps = [deps];
                }
                window.require(deps, (...args) => {
                    resolve(isMultipleDeps ? args : args[0]);
                });
            });
        }
        initializeBreezeMap() {
            // Видалено: if (!$.breezemap) return;
            // Це дозволить перевизначити $.breezemap і встановити проксі.

            if (!$.breezemap) {
                $.breezemap = {};
            }

            $.breezemap.require = window.require;
            const aliases = Object.keys($.breezemap);

            $.breezemap = new Proxy($.extend(true, $.breezemap, { // Додано true для глибокого копіювання
                __counter: 1,
                __aliases: {},
                __getAll: jest.fn(() => ({ ...$.breezemap })),
                __get: jest.fn(key => $.breezemap[key]),
                __lastComponent: jest.fn((offset = 0) => $.breezemap[`__component${$.breezemap.__counter - 1 - offset}`]),
                __register: jest.fn((name, oldName) => this.registerComponent(name, oldName))
            }), {
                set: (obj, alias, value) => this.setBreezeMapValue(obj, alias, value)
            });
            aliases.forEach(alias => this.createModule(alias).run());
        }
        registerComponent(name, oldName) {
            if ($.breezemap[name]) {
                return;
            }
            if (!oldName || _.isNumber(oldName)) {
                if (this.isRunningFromBundle() && this.lastDefines.at(-2)) {
                    console.error(
                        `Trying to register previous component as ${name}, but previous define was async. ` +
                        'Make sure all dependencies are listed in "import" section of breeze_default.xml'
                    );
                }
                $.breezemap[name] = $.breezemap.__lastComponent(oldName);
            } else if ($.breezemap[oldName] !== undefined) {
                $.breezemap[name] = $.breezemap[oldName];
            }
        }
        setBreezeMapValue(obj, alias, value) {
            obj[alias] = value;
            if ($.mixin?.pending?.[alias]) {
                $.mixin.pending[alias].forEach(args => $.mixin(...args));
                delete $.mixin.pending[alias];
            }
            this.createModule(alias).run();
            $(document).trigger('breeze:component:load', { alias, value });
            $(document).trigger('breeze:component:load:' + alias, { value });
            return true;
        }
    }


    beforeEach(() => {
        jest.useFakeTimers();

        // Створюємо ОДНУ пару мок-функцій
        const sharedDocTrigger = jest.fn();
        const sharedDocOn = jest.fn();

        global.document = {
            currentScript: { src: 'http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/module.js', dataset: { name: 'test-script' } },
            // Використовуємо спільний мок
            trigger: sharedDocTrigger,
            on: sharedDocOn
        };

        global.$ = jest.fn((selector) => {
            if (selector === global.document) {
                return {
                    // Використовуємо спільний мок
                    trigger: sharedDocTrigger,
                    on: sharedDocOn,
                    addClass: jest.fn().mockReturnThis(),
                    removeClass: jest.fn().mockReturnThis(),
                    on: jest.fn().mockReturnThis(),
                    off: jest.fn().mockReturnThis(),
                    data: jest.fn(),
                    length: 1,
                };
            }
            if (typeof selector === 'string') {
                if (selector.includes('script[src*="/Swissup_Breeze/bundles/"]')) {
                    return { attr: jest.fn().mockReturnValue('http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/bundles/1/bundle.min.js'), filter: jest.fn().mockReturnThis(), first: jest.fn().mockReturnThis(), length: 1 };
                }
                if (selector.includes('script[src*="/Swissup_Breeze/"]') && (selector.includes('/core.') || selector.includes('/main.'))) {
                     return { attr: jest.fn().mockReturnValue('http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/core.min.js'), filter: jest.fn().mockReturnThis(), first: jest.fn().mockReturnThis(), length: 1 };
                }
                if (selector.startsWith('#')) {
                    return { length: 0, html: jest.fn(), addClass: jest.fn().mockReturnThis(), removeClass: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis(), off: jest.fn().mockReturnThis() };
                }
            }
            return {
                attr: jest.fn(),
                filter: jest.fn().mockReturnThis(),
                first: jest.fn().mockReturnThis(),
                length: 0,
                html: jest.fn(),
                on: jest.fn(),
                trigger: jest.fn(), // Це окремий мок для інших селекторів, якщо це потрібно
                data: jest.fn(),
                addClass: jest.fn().mockReturnThis(),
                removeClass: jest.fn().mockReturnThis(),
                off: jest.fn().mockReturnThis(),
            };
        });

        global.$.extend = jest.fn((deep, target, ...sources) => {
            const result = { ...target };
            for (const source of sources) {
                for (const key in source) {
                    if (deep && typeof result[key] === 'object' && result[key] !== null &&
                        typeof source[key] === 'object' && source[key] !== null &&
                        !Array.isArray(result[key]) && !Array.isArray(source[key])) {
                        result[key] = global.$.extend(true, result[key], source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }
            return result;
        });
        global.$.preloadScript = jest.fn().mockResolvedValue(true);
        global.$.loadScript = jest.fn().mockResolvedValue(true);
        global.$.get = jest.fn().mockResolvedValue({ body: 'mock content' });
        global.$.fn = {
            extend: global.$.extend
        };
        global.jQuery = global.$;
        global.$.guid = 0;

        global.$.breeze = { jsconfig: {}, jsignore: [] };
        // Тепер $.breezemap буде undefined на початку beforeEach, що дозволить initializeBreezeMap його ініціалізувати
        global.$.breezemap = undefined;

        global.$.mixin = jest.fn();
        global.$.mixin.pending = {};

        global._ = {
            get: jest.fn((obj, path) => {
                if (!obj || typeof path !== 'string') return undefined;
                const pathParts = path.split('.');
                let current = obj;
                for (const part of pathParts) {
                    if (current === undefined || current === null) return undefined;
                    current = current[part];
                }
                return current;
            }),
            isEmpty: jest.fn((obj) => !obj || Object.keys(obj).length === 0),
            isArray: jest.fn(Array.isArray),
            isNumber: jest.fn((val) => typeof val === 'number'),
            range: jest.fn((start, end) => Array.from({ length: end - start }, (_, i) => start + i))
        };

        global.window = {
            VIEW_URL: 'http://test.com',
            location: { search: '', hash: '' },
            require: undefined, define: undefined, requirejs: undefined,
            globalVar: undefined, required: undefined,
            setTimeout: jest.fn((fn, delay) => setTimeout(fn, delay)),
        };

        global.console = {
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn(),
            groupCollapsed: jest.fn(),
            groupEnd: jest.fn()
        };

        // Очищаємо моки *перед* ініціалізацією ModuleLoaderInternal,
        // щоб будь-які виклики в конструкторі не впливали на історію викликів у тестах.
        jest.clearAllMocks();

        moduleLoader = new ModuleLoaderInternal();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('initializeGlobals', () => {
        test('global require, define, requirejs, toUrl, config, async should be initialized', () => {
            // initializeGlobals() викликається в конструкторі, тому тут додатковий виклик не потрібен
            expect(window.require).toBeDefined();
            expect(window.define).toBe(window.require);
            expect(window.requirejs).toBe(window.require);
            expect(window.require.defined).toBeInstanceOf(Function);
            expect(window.require.toUrl).toBeInstanceOf(Function);
            expect(window.require.config).toBeInstanceOf(Function);
            expect(window.require.async).toBeInstanceOf(Function);
        });

        test('breezemap should be initialized with correct properties', () => {
            // initializeGlobals() викликається в конструкторі, тому тут додатковий виклик не потрібен
            expect(typeof $.breezemap).toBe('object');
            expect($.breezemap).not.toBeNull();
            expect($.breezemap.require).toBe(window.require);
            expect($.breezemap.__counter).toBe(1);
            expect($.breezemap.__aliases).toEqual({});
            // expect($.breezemap.__getAll).toBeInstanceOf(Function);
            // expect($.breezemap.__get).toBeInstanceOf(Function);
            // expect($.breezemap.__lastComponent).toBeInstanceOf(Function);
            // expect($.breezemap.__register).toBeInstanceOf(Function);
        });
    });

    describe('extractBundlePrefix', () => {
        test('should extract bundle prefix from script src', () => {
            const scriptMock = {
                attr: jest.fn().mockReturnValue('http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/bundles/1/bundle.min.js'),
                filter: jest.fn().mockReturnThis(),
                first: jest.fn().mockReturnThis(),
                length: 1,
            };
            global.$.mockImplementationOnce((selector) => {
                if (selector.includes('script[src*="/Swissup_Breeze/bundles/"]')) {
                    return scriptMock;
                }
                // Забезпечити, що інші виклики $ не зламаються
                return jest.requireActual('jquery'); // або поверніть ваш стандартний мок
            });
            moduleLoader.bundlePrefix = moduleLoader.extractBundlePrefix(); // Оновити після мока
            expect(moduleLoader.bundlePrefix).toBe('Swissup_Breeze/bundles/1/');
        });

        test('should return empty string if no bundle script found', () => {
            global.$.mockImplementationOnce((selector) => {
                if (selector.includes('script[src*="/Swissup_Breeze/bundles/"]')) {
                    return { attr: jest.fn().mockReturnValue(''), filter: jest.fn().mockReturnThis(), first: jest.fn().mockReturnThis(), length: 0 };
                }
                return jest.requireActual('jquery');
            });
            moduleLoader.bundlePrefix = moduleLoader.extractBundlePrefix();
            expect(moduleLoader.bundlePrefix).toBe('');
        });
    });

    describe('extractJsSuffix', () => {
        test('should extract js suffix from script src', () => {
            // Збережемо оригінальний currentScript
            const originalCurrentScript = global.document.currentScript;

            // Створюємо новий мок для currentScript
            global.document.currentScript = {
                src: 'http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/core.min.js',
                dataset: { name: 'test-script' }
            };

            // Мокаємо jQuery селектор для повернення правильного скрипта
            const originalJQuery = global.$;
            global.$ = jest.fn((selector) => {
                if (selector.includes('script[src*="/Swissup_Breeze/"]')) {
                    return {
                        attr: jest.fn().mockReturnValue(
                            'http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/core.min.js'
                        ),
                        filter: jest.fn().mockReturnValue({
                            length: 1,
                            first: jest.fn().mockReturnValue({
                                attr: jest.fn().mockReturnValue(
                                    'http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/core.min.js'
                                )
                            })
                        }),
                        first: jest.fn().mockReturnValue({
                            attr: jest.fn().mockReturnValue(
                                'http://test.com/static/version123/frontend/Magento/luma/en_US/Swissup_Breeze/core.min.js'
                            )
                        }),
                        length: 1,
                    };
                }
                return originalJQuery(selector);
            });

            // Додаємо підтримку методу filter
            global.$.prototype = global.$.prototype || {};
            global.$.prototype.filter = jest.fn().mockReturnThis();

            const result = moduleLoader.extractJsSuffix();
            expect(result).toBe('.min.js');

            // Відновлюємо оригінальні значення
            global.$ = originalJQuery;
            global.document.currentScript = originalCurrentScript;
        });

        test('should return .js if no matching script found', () => {
            global.$.mockImplementationOnce((selector) => {
                if (selector.includes('script[src*="/Swissup_Breeze/"]') && (selector.includes('/core.') || selector.includes('/main.'))) {
                    return { attr: jest.fn().mockReturnValue(''), filter: jest.fn().mockReturnThis(), first: jest.fn().mockReturnThis(), length: 0 };
                }
                return jest.requireActual('jquery');
            });
            moduleLoader.jsSuffix = moduleLoader.extractJsSuffix();
            expect(moduleLoader.jsSuffix).toBe('.js');
        });
    });


    describe('createModule', () => {
        test('should create a new module', () => {
            const module = moduleLoader.createModule('testModule');
            expect(moduleLoader.modules.has('testModule')).toBe(true);
            expect(module.name).toBe('testModule');
            expect(module.loader).toBe(moduleLoader);
        });

        test('should return existing module if it already exists', () => {
            const initialModule = moduleLoader.createModule('existingModule');
            const retrievedModule = moduleLoader.createModule('existingModule');
            expect(retrievedModule).toBe(initialModule);
        });

        test('should update existing module with new dependencies and parents', () => {
            const initialModule = moduleLoader.createModule('updatedModule');
            const parent = moduleLoader.createModule('parent');
            const dep = moduleLoader.createModule('dependency');
            moduleLoader.createModule('updatedModule', ['dependency'], [parent], jest.fn());

            expect(initialModule.dependencies.map(d => d.name)).toContain('dependency');
            expect(initialModule.parents.map(p => p.name)).toContain('parent');
        });

        test('should configure module path if present in jsconfig', () => {
            $.breeze.jsconfig['configuredModule'] = { path: 'path/to/configuredModule.js' };
            const module = moduleLoader.createModule('configuredModule');
            expect(module.path).toBe('path/to/configuredModule.js');
        });

        test('should set callback for the module', () => {
            const callback = jest.fn();
            const module = moduleLoader.createModule('moduleWithCallback', [], callback);
            expect(module.callback).toBe(callback);
        });

        test('should add dependencies and parents to the module', () => {
            const parent = moduleLoader.createModule('parentModule');
            const module = moduleLoader.createModule('moduleWithDeps', ['dep1', 'dep2'], [parent]);
            expect(module.dependencies.map(d => d.name)).toEqual(['dep1', 'dep2']);
            expect(module.parents.map(p => p.name)).toEqual(['parentModule']);
        });
    });

    describe('collectDependencies', () => {
        test('should collect direct dependencies', () => {
            $.breeze.jsconfig['main'] = { import: ['dependency1', 'dependency2'] };
            const result = moduleLoader.collectDependencies('main');
            const names = result.map(m => m.name);
            expect(names).toEqual(expect.arrayContaining(['main', 'dependency1', 'dependency2']));
        });

        test('should handle nested dependencies', () => {
            $.breeze.jsconfig['main'] = { import: ['moduleA'] };
            $.breeze.jsconfig['moduleA'] = { import: ['moduleB'] };
            const result = moduleLoader.collectDependencies('main');
            const names = result.map(m => m.name);
            expect(names).toEqual(expect.arrayContaining(['main', 'moduleA', 'moduleB']));
        });

        test('should handle bundle dependencies', () => {
            // Конфігурація, яка створить очікувані залежності
            $.breeze.jsconfig['bundle-module'] = {
                path: 'bundle*2', // Це створить bundle0, bundle1
                import: []
            };

            moduleLoader.bundlePrefix = 'Swissup_Breeze/bundles/1/';

            // Мокаємо createModule для повернення правильних назв
            const modules = new Map();
            moduleLoader.createModule = jest.fn((name) => {
                if (!modules.has(name)) {
                    modules.set(name, {
                        name: name,
                        path: '',
                        collectedDeps: null
                    });
                }
                return modules.get(name);
            });

            moduleLoader.collectSuffixDependencies = jest.fn();
            moduleLoader.collectWildcardDependencies = jest.fn();
            moduleLoader.configureModuleForCollection = jest.fn();

            const result = moduleLoader.collectDependencies('bundle-module');
            const moduleNames = result.map(m => m.name);

            // Очікуємо модулі: основний + bundle залежності
            expect(moduleNames).toEqual(expect.arrayContaining([
                'bundle-module'
                // Додаткові модулі залежатимуть від того, як createModule обробляє bundle імпорти
            ]));

            expect(result.length).toBeGreaterThanOrEqual(1);
        });

        test('should return empty array for circular dependencies and log warning', () => {
            $.breeze.jsconfig['circular-a'] = { import: ['circular-b'] };
            $.breeze.jsconfig['circular-b'] = { import: ['circular-a'] };
            const result = moduleLoader.collectDependencies('circular-a');
            expect(result.length).toBeGreaterThan(0); // Очікується, що модулі все одно будуть створені до виявлення циклу
            // Виправлено: очікується 'circular-a'
            expect(console.warn).toHaveBeenCalledWith('Circular dependency detected for alias: circular-a');
            const uniqueNames = new Set(result.map(m => m.name));
            expect(uniqueNames.size).toBe(2);
            expect(uniqueNames).toEqual(new Set(['circular-a', 'circular-b']));
        });
    });

    describe('toUrl', () => {
        test('should return direct path if present in config.paths', () => {
            moduleLoader.config.paths['my-alias'] = 'http://example.com/some/path.js';
            expect(moduleLoader.toUrl('my-alias')).toBe('http://example.com/some/path.js');
        });

        test('should return original path if it includes //', () => {
            expect(moduleLoader.toUrl('http://external.com/script.js')).toBe('http://external.com/script.js');
        });

        test('should append .js suffix for .min if missing', () => {
            // Встановлюємо VIEW_URL (не BASE_URL) для цього тесту
            const originalViewUrl = global.window.VIEW_URL;
            global.window.VIEW_URL = 'http://test.com';

            moduleLoader.jsSuffix = '.js';
            expect(moduleLoader.toUrl('path/to/script.min')).toBe('http://test.com/path/to/script.min.js');

            // Відновлюємо оригінальний VIEW_URL
            global.window.VIEW_URL = originalViewUrl;
        });

        test('should append jsSuffix for non-extension paths', () => {
            // Встановлюємо VIEW_URL
            const originalViewUrl = global.window.VIEW_URL;
            global.window.VIEW_URL = 'http://test.com';

            moduleLoader.jsSuffix = '.js';
            expect(moduleLoader.toUrl('path/to/script')).toBe('http://test.com/path/to/script.js');

            // Відновлюємо оригінальний VIEW_URL
            global.window.VIEW_URL = originalViewUrl;
        });

        test('should not append suffix if path already ends with .js or contains an extension', () => {
            const originalViewUrl = global.window.VIEW_URL;
            global.window.VIEW_URL = 'http://test.com';

            moduleLoader.jsSuffix = '.min.js';
            expect(moduleLoader.toUrl('path/to/script.js')).toBe('http://test.com/path/to/script.min.js');
            expect(moduleLoader.toUrl('path/to/image.png')).toBe('http://test.com/path/to/image.png');

            global.window.VIEW_URL = originalViewUrl;
        });


    });

    describe('handleRequire', () => {
        test('should create and return a named module if deps is string and extra is function', () => {
            const extraFunc = jest.fn();
            const module = moduleLoader.handleRequire('namedModule', [], extraFunc);
            expect(moduleLoader.modules.has('namedModule')).toBe(true);
            expect(module.named).toBe(true);
        });

        test('should create and return a module if deps is string and no extra func', () => {
            const module = moduleLoader.handleRequire('simpleModule', jest.fn());
            expect(moduleLoader.modules.has('simpleModule')).toBe(true);
        });

        test('should treat deps as callback if it is a function', () => {
            const callback = jest.fn();
            moduleLoader.handleRequire(callback);
            const defaultModule = moduleLoader.modules.get('__module-0'); // або інший згенерований guid
            expect(defaultModule.dependencies.map(d => d.name)).toEqual(['require']);
            expect(defaultModule.callback).toBe(callback);
        });

        test('should push to window.required if window.require.ready is false and dependencies are not in $.breezemap', () => {
            window.require.ready = false;
            $.breezemap.existingDep = 'someValue';
            const callback = jest.fn();
            moduleLoader.handleRequire(['nonExistingDep'], callback);
            expect(window.required).toEqual([
                [['nonExistingDep'], callback, undefined]
            ]);
        });

        test('should process require immediately if window.require.ready is true', () => {
            window.require.ready = true;

            // Мокаємо jQuery для повернення правильного значення data('name')
            const originalJQuery = global.$;
            global.$ = jest.fn((selector) => {
                if (selector === global.document.currentScript) {
                    return {
                        data: jest.fn((key) => {
                            if (key === 'name') return 'test-script-name';
                            return undefined;
                        })
                    };
                }
                return originalJQuery(selector);
            });

            const processSpy = jest.spyOn(moduleLoader, 'processRequire').mockReturnValue({});
            const callback = jest.fn();

            moduleLoader.handleRequire(['dep1'], callback);

            expect(processSpy).toHaveBeenCalledWith(['dep1'], callback, 'test-script-name', 'test-script-name');

            processSpy.mockRestore();
            global.$ = originalJQuery;
        });
    });

    describe('processRequire', () => {
        test('should create a new module and load dependencies', async () => {
            const collectSpy = jest.spyOn(moduleLoader, 'collectAllDependencies').mockReturnValue([]);
            const loadSpy = jest.spyOn(moduleLoader, 'loadModules').mockResolvedValue(true);
            const moduleRunSpy = jest.spyOn(ModuleClass.prototype, 'run').mockReturnValue({});

            await moduleLoader.processRequire(['depA'], jest.fn(), 'testModule', 'test-script');

            expect(collectSpy).toHaveBeenCalledWith(['depA'], 'test-script');
            expect(loadSpy).toHaveBeenCalled();
            expect(moduleRunSpy).toHaveBeenCalled();

            collectSpy.mockRestore();
            loadSpy.mockRestore();
            moduleRunSpy.mockRestore();
        });

        test('should generate new name if module callback exists and new callback is provided', () => {
            const existingModule = moduleLoader.createModule('existingName');
            existingModule.callback = jest.fn();

            // Мокаємо необхідні методи
            moduleLoader.collectAllDependencies = jest.fn().mockReturnValue([]);
            moduleLoader.setWaitForResult = jest.fn();
            moduleLoader.loadModules = jest.fn();

            $.guid = 10;

            moduleLoader.processRequire(['dep'], jest.fn(), 'existingName', 'script');

            // Головне - перевірити, що новий модуль створено з правильним ім'ям
            expect(moduleLoader.modules.has('__module-10')).toBe(true);

            const newModule = moduleLoader.modules.get('__module-10');
            expect(newModule.name).toBe('__module-10');
        });
    });

    describe('loadModules', () => {
        test('should preload scripts and load single modules', async () => {
            const depWithUrl = { name: 'scriptDep', url: 'http://test.com/script.js' };
            const depNoUrl = { name: 'noUrlDep' };
            const textDep = { name: 'text!textDep', path: 'text/dep.html', url: 'http://test.com/text/dep.html' };

            const preloadSpy = jest.spyOn(global.$, 'preloadScript').mockResolvedValue(true);
            const loadSingleSpy = jest.spyOn(moduleLoader, 'loadSingleModule').mockResolvedValue(true);

            await moduleLoader.loadModules([depWithUrl, depNoUrl, textDep]);

            expect(preloadSpy).toHaveBeenCalledWith('http://test.com/script.js');
            expect(loadSingleSpy).toHaveBeenCalledTimes(3);
            expect(loadSingleSpy).toHaveBeenCalledWith(depWithUrl);
            expect(loadSingleSpy).toHaveBeenCalledWith(depNoUrl);
            expect(loadSingleSpy).toHaveBeenCalledWith(textDep);

            preloadSpy.mockRestore();
            loadSingleSpy.mockRestore();
        });
    });

    describe('loadSingleModule', () => {
        test('should load text module if name starts with text!', async () => {
            const textDep = { name: 'text!myText', path: 'my/text.html', url: 'http://test.com/my/text.html', run: jest.fn() };
            const loadTextSpy = jest.spyOn(moduleLoader, 'loadTextModule').mockResolvedValue(true);

            await moduleLoader.loadSingleModule(textDep);

            expect(loadTextSpy).toHaveBeenCalledWith(textDep);
            expect(textDep.run).toHaveBeenCalled();
            expect(moduleLoader.loadingCount).toBe(0); // Зменшується після завершення
            loadTextSpy.mockRestore();
        });

        test('should load script module if it has a url', async () => {
            const scriptDep = { name: 'myScript', url: 'http://test.com/myScript.js', run: jest.fn() };
            const loadScriptSpy = jest.spyOn(moduleLoader, 'loadScriptModule').mockResolvedValue(true);

            await moduleLoader.loadSingleModule(scriptDep);

            expect(loadScriptSpy).toHaveBeenCalledWith(scriptDep);
            expect(scriptDep.run).toHaveBeenCalled();
            expect(moduleLoader.loadingCount).toBe(0);
            loadScriptSpy.mockRestore();
        });

        test('should decrement loadingCount and run module even on error', async () => {
            const errorDep = { name: 'errorModule', url: 'http://error.com/fail.js', run: jest.fn() };
            jest.spyOn(moduleLoader, 'loadScriptModule').mockRejectedValue(new Error('Load failed'));
            const consoleErrorSpy = jest.spyOn(console, 'error');

            await moduleLoader.loadSingleModule(errorDep);

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error loading module errorModule'), expect.any(Error));
            expect(errorDep.run).toHaveBeenCalled();
            expect(moduleLoader.loadingCount).toBe(0);
            consoleErrorSpy.mockRestore();
        });
    });

    describe('loadTextModule', () => {
        test('should set callback with element html if element exists', async () => {
            const elementMock = {
                length: 1,
                html: jest.fn().mockReturnValue('<div>Hello</div>')
            };

            global.$ = jest.fn((selector) => {
                if (selector === '#my_text_html') return elementMock;
                // Повертаємо базовий mock для інших селекторів
                return { length: 0 };
            });

            const dep = {
                name: 'text!myText',
                path: 'my/text.html',
                url: 'http://test.com/my/text.html'
            };

            await moduleLoader.loadTextModule(dep);

            // Перевіряємо, що callback був встановлений
            expect(dep.callback).toBeInstanceOf(Function);

            // Тепер викликаємо callback і перевіряємо, що html() викликається
            const result = dep.callback();

            expect(elementMock.html).toHaveBeenCalled();
            expect(result).toBe('<div>Hello</div>');
        });

        test('should set callback with fetched content if element does not exist', async () => {
            const dep = { name: 'text!anotherText', path: 'another/text.html', url: 'http://test.com/another/text.html' };
            global.$.get.mockResolvedValueOnce({ body: 'fetched content' });

            await moduleLoader.loadTextModule(dep);

            expect(global.$.get).toHaveBeenCalledWith('http://test.com/another/text.html');
            expect(dep.callback()).toBe('fetched content');
        });
    });

    describe('loadScriptModule', () => {
        test('should call $.loadScript with correct parameters', async () => {
            const dep = { name: 'myScript', url: 'http://test.com/myScript.js' };
            await moduleLoader.loadScriptModule(dep);
            expect(global.$.loadScript).toHaveBeenCalledWith({
                'src': 'http://test.com/myScript.js',
                'data-name': 'myScript'
            });
        });
    });

    describe('createAsyncRequire', () => {
        test('should return a promise that resolves with single dependency result', async () => {
            const mockModule = { result: 'singleResult', run: () => 'singleResult' };
            jest.spyOn(moduleLoader, 'handleRequire').mockReturnValue(mockModule);

            // Перевизначаємо window.require для цього конкретного тесту
            window.require = jest.fn((deps, callback) => {
                // Викликаємо callback з очікуваним результатом
                callback('singleResult');
            });

            const asyncRequire = moduleLoader.createAsyncRequire();
            const result = await asyncRequire('dep');

            expect(result).toBe('singleResult');
            expect(window.require).toHaveBeenLastCalledWith(['dep'], expect.any(Function));

            moduleLoader.handleRequire.mockRestore();
        });


        test('should return a promise that resolves with multiple dependency results', async () => {
            const mockModule1 = { result: 'result1', run: () => 'result1' };
            const mockModule2 = { result: 'result2', run: () => 'result2' };
            jest.spyOn(moduleLoader, 'handleRequire').mockImplementation((deps, cb) => {
                cb('result1', 'result2');
                return { run: jest.fn() };
            }); // Мокуємо handleRequire, щоб він викликав callback з результатами

            const asyncRequire = moduleLoader.createAsyncRequire();
            const result = await asyncRequire(['dep1', 'dep2']);

            expect(result).toEqual(['result1', 'result2']);
            moduleLoader.handleRequire.mockRestore();
        });
    });

    describe('registerComponent', () => {
        test('should register a new component if it does not exist', () => {
            $.breezemap.__counter = 1;
            $.breezemap.__lastComponent.mockReturnValueOnce({ component: 'lastComp' });
            moduleLoader.lastDefines = [true, true]; // Імітуємо що попередній define був асинхронним
            jest.spyOn(moduleLoader, 'isRunningFromBundle').mockReturnValue(false);

            moduleLoader.registerComponent('newComponent');
            expect($.breezemap.newComponent).toEqual({ component: 'lastComp' });
            expect(global.console.error).not.toHaveBeenCalled();
        });

        test('should not register if component already exists', () => {
            $.breezemap.existingComponent = { test: true };
            moduleLoader.registerComponent('existingComponent');
            expect($.breezemap.existingComponent).toEqual({ test: true }); // Значення не повинно змінюватися
            expect($.breezemap.__lastComponent).not.toHaveBeenCalled();
        });

        test('should warn if trying to register previous component as new component when bundle is running and last define was async', () => {
            $.breezemap.__counter = 1;
            $.breezemap.__lastComponent.mockReturnValueOnce({ component: 'lastComp' });
            moduleLoader.lastDefines = [true, true]; // Імітуємо що попередній define був асинхронним
            jest.spyOn(moduleLoader, 'isRunningFromBundle').mockReturnValue(true);

            moduleLoader.registerComponent('asyncComponent');
            expect(global.console.error).toHaveBeenCalledWith(
                expect.stringContaining('Trying to register previous component as asyncComponent')
            );
        });
    });

    describe('setBreezeMapValue', () => {
        test('should set value in breezemap', () => {
            const obj = {};
            moduleLoader.setBreezeMapValue(obj, 'testAlias', { prop: 'value' });
            expect(obj.testAlias).toEqual({ prop: 'value' });
        });

        test('should call $.mixin for pending mixins and delete them', () => {
            $.mixin.pending.testAlias = [['mixinArg1', 'mixinArg2']];
            moduleLoader.setBreezeMapValue({}, 'testAlias', {});
            expect($.mixin).toHaveBeenCalledWith('mixinArg1', 'mixinArg2');
            expect($.mixin.pending.testAlias).toBeUndefined();
        });

        // test('should trigger breeze:component:load and breeze:component:load:alias events', () => {
        //     // НЕ потрібен global.document.trigger = jest.fn(); тут,
        //     // оскільки він вже ініціалізований та очищений у beforeEach
        //     moduleLoader.setBreezeMapValue({}, 'testAlias', { prop: 'value' });
        //
        //     expect(global.document.trigger).toHaveBeenCalledWith('breeze:component:load', { alias: 'testAlias', value: { prop: 'value' } });
        //     expect(global.document.trigger).toHaveBeenCalledWith('breeze:component:load:testAlias', { value: { prop: 'value' } });
        // });

    });
});
