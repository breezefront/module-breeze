((cash) => {
    'use strict';

    const originalLog = console.log;
    const debug = function (...args) {
        const err = new Error();
        const stackLine = err.stack.split('\n')[2];
        originalLog(...args, `(${stackLine.trim()})`);
    };

    class BreezeModuleLoader {
        constructor($) {
            this.$ = $;
            this.modules = new Map();
            this.loadingCount = 0;
            this.config = {
                paths: {},
                shim: {},
            };
            this.defaultStackTraceLimit = Error.stackTraceLimit || 10;
            this.autoloadedBundles = new Set();
            this.lastDefines = [];
            this.bundlePathRe = /(?<path>Swissup_Breeze\/bundles\/\d+\/.*?)\d*(\.min\.js|\.js)$/;
            this.bundlePrefixRe = /(?<prefix>Swissup_Breeze\/bundles\/\d+\/).*\.js$/;
            this.suffixRe = /Swissup_Breeze\/.*?(core|main)(?<suffix>\.min\.js|\.js)$/;
            this.bundlePrefix = this.extractBundlePrefix();
            this.jsSuffix = this.extractJsSuffix();
            this.initializeGlobals();
        }

        extractBundlePrefix() {
            try {
                const script = this.$('script[src*="/Swissup_Breeze/bundles/"]').first();
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
                const scripts = this.$('script[src*="/Swissup_Breeze/"]')
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

            const module = new BreezeModule(name, this);
            this.modules.set(name, module);
            this.configureModulePath(module);
            this.setModuleCallback(module, callback);
            this.addModuleDependencies(module, deps, parents);
            return module;
        }

        updateModule(module, deps, parents, callback) {
            if (callback && module.callback && callback !== module.callback) {
                console.warn(`[BreezeModuleLoader] Callback override for "${module.name}"`);
            }
            if (!module.callback && callback) {
                module.callback = callback;
            }
            module.addParents(parents);
            module.addDependencies(deps.map(depName => this.createModule(depName, [], [module])));
        }

        configureModulePath(module) {
            const jsconfig = this.$.breeze?.jsconfig || {};
            if (jsconfig[module.name]) {
                module.path = jsconfig[module.name].path;
            } else if (module.name.startsWith('text!')) {
                module.path = module.name.substr(5);
            } else if (!_.isEmpty(jsconfig) && !module.name.startsWith('__') && !this.$.breezemap?.__get(module.name)) {
                module.unknown = true;
                module.waitForResult = true;
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

        collectDeps(depname) {
            const dep = this.createModule(depname);
            if (dep.collectedDeps) {
                return dep.collectedDeps;
            }

            const result = [];
            dep.dependencies.forEach(childDep => result.push(...this.collectDeps(childDep.name)));
            result.push(dep);
            dep.collectedDeps = result;
            return result;
        }

        createRequireFunction() {
            return (deps, callback, extra) => {
                debug(['require Function() called', arguments]);
                let module, depsWithImports = [];
                const currentScript = document.currentScript;
                const scriptName = currentScript?.dataset?.name;
                const isBundle = this.isRunningFromBundle();
                const bundlePath = isBundle && currentScript?.src
                    ? currentScript.src.match(this.bundlePathRe)?.groups?.path
                    : undefined;

                const name = isBundle ? undefined : scriptName;

                // Handle define('name', [], callback)
                if (typeof deps === 'string' && typeof extra === 'function') {
                    module = this.createModule(deps, callback, extra);
                    module.named = true;
                    debug('[define()] called with deps:', deps);
                    return module;
                }

                if (typeof deps === 'string') {
                    deps = [deps];
                }

                module = this.createModule(name || `__module-${this.$.guid++}`, deps, callback);
                deps.forEach(depname => depsWithImports.push(...this.collectDeps(depname)));
                depsWithImports.filter(dep => dep.getGlobalValue()).forEach(dep => dep.run());

                if (bundlePath) {
                    depsWithImports = depsWithImports.filter(dep => !dep.name.includes(bundlePath));
                }

                depsWithImports = depsWithImports
                    .filter(dep => !dep.loaded && (dep.path || dep.named) && dep.name !== scriptName)
                    .map(dep => {
                        if (dep.path?.includes('//')) {
                            dep.url = dep.path.endsWith('.js') || dep.path.endsWith('/') || dep.path.includes('?')
                                ? dep.path
                                : dep.path + '.js';
                        } else if (dep.path) {
                            dep.url = window.require.toUrl(dep.path);
                        }
                        return dep;
                    });

                const ranModule = (mod, timeout = 1) => {
                    setTimeout(() => {
                        console.debug('[Breeze] Running module', mod.name);
                        mod.run();
                    }, timeout);
                };

                if (depsWithImports.length) {
                    this.loadingCount++;
                    this.$(depsWithImports.map(dep => dep.url)).loadScript()
                        .always(() => {
                            this.loadingCount--;
                            ranModule(module);
                        })
                        .fail(console.error);
                } else {
                    ranModule(module);
                }

                debug('[define()] called with deps:', deps);
                return module;
            };
        }

        initializeGlobals() {
            debug('define.js initializing globals');
            window.require = this.createRequireFunction();
            window.define = window.requirejs = window.require;
            window.require.defined = (name) => this.createModule(name).loaded;
            window.require.toUrl = (path) => path;
            window.require.config = (cfg) => this.$.extend(true, this.config, cfg || {});
            window.require.async = (deps) => new Promise(resolve => {
                const isMultipleDeps = Array.isArray(deps);
                if (!isMultipleDeps) {
                    deps = [deps];
                }
                window.require(deps, (...args) => {
                    resolve(isMultipleDeps ? args : args[0]);
                });
            });
            this.initializeBreezeMap();
        }

        initializeBreezeMap() {
            if (!this.$.breezemap) return;

            this.$.breezemap.require = window.require;
            const aliases = Object.keys(this.$.breezemap);
            this.$.breezemap = new Proxy(this.$.extend(this.$.breezemap, {
                __counter: 1,
                __aliases: {},
                __getAll: () => ({ ...this.$.breezemap }),
                __get: key => this.$.breezemap[key],
                __lastComponent: (offset = 0) => this.$.breezemap[`__component${this.$.breezemap.__counter - 1 - offset}`],
                __register: (name, oldName) => {
                    if (this.$.breezemap[name]) {
                        return;
                    }
                    if (!oldName || typeof oldName === 'number') {
                        this.$.breezemap[name] = this.$.breezemap.__lastComponent(oldName);
                    } else if (this.$.breezemap[oldName] !== undefined) {
                        this.$.breezemap[name] = this.$.breezemap[oldName];
                    }
                }
            }), {
                set: (obj, alias, value) => {
                    obj[alias] = value;
                    if (this.$.mixin?.pending?.[alias]) {
                        this.$.mixin.pending[alias].forEach(args => this.$.mixin(...args));
                        delete this.$.mixin.pending[alias];
                    }
                    this.createModule(alias).run();
                    this.$(document).trigger('breeze:component:load', { alias, value });
                    this.$(document).trigger('breeze:component:load:' + alias, { value });
                    return true;
                }
            });
            aliases.forEach(alias => this.createModule(alias).run());
        }
    }

    const loader = new BreezeModuleLoader(cash);
})(window.cash || window.$);
