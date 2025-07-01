(() => {
    'use strict';

    /**
     * Module loader for Swissup Breeze
     */
    class ModuleLoader {
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

            // Safe regular expressions with validation
            this.bundlePrefixRe = /(?<prefix>Swissup_Breeze\/bundles\/\d+\/).*\.js$/;
            this.suffixRe = /Swissup_Breeze\/.*?(core|main)(?<suffix>\.min\.js|\.js)$/;

            this.bundlePrefix = this.extractBundlePrefix();
            this.jsSuffix = this.extractJsSuffix();

            this.initializeGlobals();
        }

        /**
         * Safely gets the bundle prefix
         */
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

        /**
         * Safely gets the JS suffix
         */
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

        /**
         * Checks if the code is running from a bundle
         */
        isRunningFromBundle() {
            try {
                return document.currentScript?.src?.includes('Swissup_Breeze/bundles/') || false;
            } catch (error) {
                console.error('Error checking bundle status:', error);
                return false;
            }
        }

        /**
         * Creates a module
         */
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

            const module = new Module(name, this);
            this.modules.set(name, module);

            this.configureModulePath(module);
            this.setModuleCallback(module, callback);
            this.addModuleDependencies(module, deps, parents);

            return module;
        }

        /**
         * Updates an existing module
         */
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

        /**
         * Configures the module path
         */
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

        /**
         * Finds path by wildcard pattern
         */
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

        /**
         * Sets the callback for the module
         */
        setModuleCallback(module, callback) {
            if (callback) {
                module.callback = callback;
            }
        }

        /**
         * Adds module dependencies
         */
        addModuleDependencies(module, deps, parents) {
            module.addParents(parents);
            const dependencies = deps.map(depName => this.createModule(depName, [], [module]));
            module.addDependencies(dependencies);
        }

        /**
         * Collects dependencies with circular reference handling
         */
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

        /**
         * Internal logic for collecting dependencies
         */
        doCollectDependencies(alias, aliasAsPath, isKnown, visited) {
            const jsconfig = $.breeze?.jsconfig || {};
            const result = [];

            let path = aliasAsPath ? alias : jsconfig[alias]?.path || alias;
            const imports = aliasAsPath ? [] : jsconfig[alias]?.import || [];
            const index = imports.indexOf(alias);

            // Handle bundle patterns
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

            // Collect dependencies from imports
            imports.forEach((item, i) => {
                const deps = this.collectDependencies(item, i === index, true, visited);
                result.push(...deps);
            });

            // Collect dependencies from suffix modules
            this.collectSuffixDependencies(alias, result, visited);

            // Collect dependencies from wildcard modules
            this.collectWildcardDependencies(alias, result, visited);

            this.configureModuleForCollection(module, path, alias, isKnown);

            result.push(module);
            module.collectedDeps = result;

            return result;
        }

        /**
         * Collects dependencies from suffix modules
         */
        collectSuffixDependencies(alias, result, visited) {
            const jsconfig = $.breeze?.jsconfig || {};
            const suffixKeys = Object.keys(jsconfig).filter(key => key.endsWith(`.${alias}`));

            suffixKeys.forEach(key => {
                const deps = this.collectDependencies(key, false, false, visited);
                result.push(...deps);
            });
        }

        /**
         * Collects dependencies from wildcard modules
         */
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

        /**
         * Configures the module for collection
         */
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

        /**
         * Converts path to URL
         */
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

        /**
         * Initializes global objects
         */
        initializeGlobals() {
            // Initialize require function
            window.require = this.createRequireFunction();
            window.define = window.requirejs = window.require;

            // Additional methods
            window.require.defined = (name) => this.createModule(name).loaded;
            window.require.toUrl = (path) => this.toUrl(path);
            window.require.config = (cfg) => $.extend(true, this.config, cfg || {});
            window.require.async = this.createAsyncRequire();

            this.initializeBreezeMap();
        }

        /**
         * Creates the require function
         */
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

        /**
         * Handles require call
         */
        handleRequire(deps, callback, extra) {
            const scriptName = $(document.currentScript).data('name');
            const name = this.isRunningFromBundle() ? undefined : scriptName;

            // Handle different call formats
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

            // Check readiness
            if (!window.require.ready && !deps.every?.(arg => $.breezemap?.[arg])) {
                window.required = window.required || [];
                window.required.push([deps, callback, extra]);
                return;
            }

            return this.processRequire(deps, callback, name, scriptName);
        }

        /**
         * Processes require request
         */
        processRequire(deps, callback, name, scriptName) {
            // Generate unique name if necessary
            if ((this.modules.get(name)?.callback || this.modules.get(name)?.ran) && callback) {
                name = `__module-${$.guid++}`;
            }

            const module = this.createModule(name || `__module-${$.guid++}`, deps, callback);

            // Collect all dependencies
            const allDeps = this.collectAllDependencies(deps, scriptName);

            // Set wait for result flag
            this.setWaitForResult(callback, deps);

            // Load modules
            this.loadModules(allDeps);

            return module.run();
        }

        /**
         * Collects all dependencies
         */
        collectAllDependencies(deps, scriptName) {
            const depsWithImports = [];

            deps.forEach(depName => {
                const collected = this.collectDependencies(depName);
                depsWithImports.push(...collected);
            });

            // Execute global modules
            depsWithImports
                .filter(dep => dep.getGlobalValue())
                .forEach(dep => dep.run());

            return depsWithImports
                .filter(dep => !dep.loaded && (dep.path || dep.named) && dep.name !== scriptName)
                .map(dep => this.prepareDepForLoading(dep));
        }

        /**
         * Prepares dependency for loading
         */
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

        /**
         * Sets the wait for result flag
         */
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

        /**
         * Loads modules
         */
        async loadModules(allDeps) {
            const hasUrls = allDeps.some(dep => dep.url);
            this.lastDefines.push(hasUrls);

            // Preload scripts
            const scriptsToLoad = allDeps.filter(dep => dep.url && !dep.name.startsWith('text!'));

            try {
                await Promise.all(scriptsToLoad.map(dep => $.preloadScript(dep.url)));
            } catch (error) {
                console.error('Error preloading scripts:', error);
            }

            // Load each dependency
            for (const dep of allDeps) {
                await this.loadSingleModule(dep);
            }
        }

        /**
         * Loads a single module
         */
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

        /**
         * Loads a text module
         */
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

        /**
         * Loads a script module
         */
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

        /**
         * Creates an async require function
         */
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

        /**
         * Initializes breezemap
         */
        initializeBreezeMap() {
            if (!$.breezemap) return;

            $.breezemap.require = window.require;
            const aliases = Object.keys($.breezemap);

            // Create proxy for breezemap
            $.breezemap = new Proxy($.extend($.breezemap, {
                __counter: 1,
                __aliases: {},
                __getAll: () => ({ ...$.breezemap }),
                __get: key => $.breezemap[key],
                __lastComponent: (offset = 0) => $.breezemap[`__component${$.breezemap.__counter - 1 - offset}`],
                __register: (name, oldName) => this.registerComponent(name, oldName)
            }), {
                set: (obj, alias, value) => this.setBreezeMapValue(obj, alias, value)
            });

            // Run existing modules
            aliases.forEach(alias => this.createModule(alias).run());
        }

        /**
         * Registers a component
         */
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

        /**
         * Sets value in breezemap
         */
        setBreezeMapValue(obj, alias, value) {
            obj[alias] = value;

            // Handle pending mixins
            if ($.mixin?.pending?.[alias]) {
                $.mixin.pending[alias].forEach(args => $.mixin(...args));
                delete $.mixin.pending[alias];
            }

            // Run module
            this.createModule(alias).run();

            // Trigger events
            $(document).trigger('breeze:component:load', { alias, value });
            $(document).trigger('breeze:component:load:' + alias, { value });

            return true;
        }
    }

    /**
     * Module class
     */
    class Module {
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

        /**
         * Adds parent modules
         */
        addParents(parents) {
            this.parents.push(...parents);
        }

        /**
         * Adds dependencies
         */
        addDependencies(dependencies) {
            this.dependencies.push(...dependencies);
        }

        /**
         * Gets global value
         */
        getGlobalValue() {
            const shimConfig = this.loader.config.shim[this.name];
            if (shimConfig?.exports) {
                return _.get(window, shimConfig.exports.split('.'));
            }
            return null;
        }

        /**
         * Runs the module
         */
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

        /**
         * Executes callback
         */
        executeCallback() {
            if (this.callback) {
                const args = this.dependencies.map(dep => dep.run());
                this.result = this.callback.apply(window, args);
            }
        }

        /**
         * Processes result
         */
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

        /**
         * Handles bundle autoloading
         */
        handleAutoload() {
            const jsconfig = $.breeze?.jsconfig || {};
            const bundleName = jsconfig[this.name]?.bundle;

            if (bundleName && !this.loader.autoloadedBundles.has(bundleName)) {
                this.loader.autoloadedBundles.add(bundleName);
                $(document).trigger('bundle:autoload', bundleName);
            }
        }

        /**
         * Registers in breezemap
         */
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

        /**
         * Handles unresolved dependencies
         */
        handleUnresolvedDependency() {
            if (this.result === undefined && this.waitForResult && !this.failed &&
                this.path && !this.path.includes('//')) {

                this.ran = this.loaded = false;
                setTimeout(() => this.reportUnresolved(), 100);
            }
        }

        /**
         * Reports unresolved dependencies
         */
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

        /**
         * Runs parent modules
         */
        runParents() {
            this.parents.forEach(parent => parent.run());
        }

        /**
         * Reports unknown component
         */
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
    }

    // Initialize the loader
    const moduleLoader = new ModuleLoader();

})();
