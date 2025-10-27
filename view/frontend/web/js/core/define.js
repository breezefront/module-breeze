(() => {
    'use strict';

    var modules = {},
        htmls = {},
        aliases = [],
        lastDefines = [],
        loadingCount = 0,
        config = {
            paths: {},
            shim: {},
        },
        defaultStackTraceLimit = Error.stackTraceLimit || 10,
        autoloadedBundles = {},
        origSuffix = '-mage-original',
        bundlePathRe = /(?<path>Swissup_Breeze\/bundles\/\d+\/.*?)\d*(\.min\.js|\.js)$/,
        bundlePrefixRe = /(?<prefix>Swissup_Breeze\/bundles\/\d+\/).*\.js$/,
        bundlePrefix = $('script[src*="/Swissup_Breeze/bundles/"]').attr('src')?.match(bundlePrefixRe).groups.prefix,
        suffixRe = /Swissup_Breeze\/.*?(core|main)(?<suffix>\.min\.js|\.js)$/,
        jsSuffix = $('script[src*="/Swissup_Breeze/"]')
            .filter((i, el) => el.src.includes('/core.') || el.src.includes('/main.'))
            .attr('src')
            .match(suffixRe).groups.suffix;

    function isRunningFromBundle() {
        return document.currentScript?.src.includes('Swissup_Breeze/bundles/');
    }

    function global() {
        if (config.shim[this.name]?.exports) {
            return _.get(window, config.shim[this.name].exports.split('.'));
        }
    }

    function run() {
        if (this.ran || this.deps.some(dep => !dep.loaded)) {
            return this.result;
        }

        this.ran = true;
        try {
            this.result = this.cb?.apply(window, this.deps.map(dep => dep.run()));
        } catch (e) {
            console.error(e);
        }
        this.loaded = true;

        if (this.result === undefined) {
            this.result = this.global();
        }

        if (this.result?.component && typeof this.result?.component === 'string') {
            $.breezemap[this.result?.component] = this.result;
        }

        if ($.breezemap.__has(this.name)) {
            this.result = $.breezemap.__get(this.name);
        }

        if ($.breeze.jsconfig[this.name]?.bundle && !autoloadedBundles[$.breeze.jsconfig[this.name].bundle]) {
            autoloadedBundles[$.breeze.jsconfig[this.name].bundle] = true;
            $(document).trigger('bundle:autoload', $.breeze.jsconfig[this.name].bundle);
        }

        if (this.result !== undefined && !(this.result instanceof $)) {
            [this.name].forEach(alias => {
                if (alias.endsWith(origSuffix)) {
                    alias = alias.slice(0, -1 * origSuffix.length);
                } else {
                    alias = alias.startsWith('__module-') ? `__component${$.breezemap.__counter++}` : alias;
                }

                if ($.breezemap.__get(alias)) {
                    return;
                }

                $.breezemap[alias] = this.result;
            });
        }

        if (this.result === undefined && this.waitForResult && !this.failed &&
            this.path && !this.path.includes('//')
        ) {
            this.ran = this.loaded = false;
            setTimeout(function reportUnresolved() {
                if (this.loaded) {
                    return;
                }

                if (loadingCount) {
                    return setTimeout(reportUnresolved.bind(this), 1000);
                }

                console.error('Unable to resolve dependency', this);
                this.failed = true;
                this.run();
            }.bind(this), 100);
        } else {
            this.parents.forEach(parent => parent.run());
        }

        if (this.result === undefined && this.unknown && !this.ignored &&
            (true || window.location.search.includes('breeze=1') || window.location.hash.includes('breeze'))
        ) {
            Error.stackTraceLimit = 100;
            console.groupCollapsed(this.name);
            console.log(new Error(`Unknown component ${this.name}`));
            console.groupEnd();
            Error.stackTraceLimit = defaultStackTraceLimit;
        }

        return this.result;
    }

    function getModule(name, deps = [], parents = [], cb) {
        if (typeof parents === 'function') {
            cb = parents;
            parents = [];
        }

        if (!modules[name]) {
            modules[name] = {
                name,
                parents: [],
                deps: [],
                global,
                run
            };

            if ($.breeze.jsconfig[name]) {
                modules[name].path = $.breeze.jsconfig[name].path;
            } else if (name.startsWith('text!')) {
                modules[name].path = name.substr(5);
            } else if ($.breeze.jsignore?.includes(name) ||
                $.breeze.jsignore?.filter(k => k.includes('*')).some(k => name.startsWith(k.split('*').at(0)))
            ) {
                modules[name].ignored = true;
                modules[name].loaded = true;
                modules[name].result = false;
            } else if (!name.startsWith('__') && !name.endsWith(origSuffix) && !$.breezemap.__has(name)) {
                Object.keys($.breeze.jsconfig).filter(k => k.includes('*')).some(k => {
                    if (name.startsWith(k.split('*').at(0))) {
                        modules[name].path = name;
                        return true;
                    }
                });

                // Experimental: load unknown components
                // AutoRegister short names like 'navpro'
                if (!modules[name].path && require.config().map?.['*']?.[name]) {
                    console.debug(`AutoRegister alias: ${name}`);
                    modules[name].path = require.config().map['*'][name];
                }

                // AutoRegister paths: Vendor_Module/js/file, js/hello, main
                if (!modules[name].path// &&
                    // !name.startsWith('Magento_')
                ) {
                    console.debug(`AutoRegister path: ${name}`);
                    modules[name].path = name;
                }
            }
        }

        modules[name].cb = modules[name].cb || cb;
        modules[name].parents.push(...parents);
        modules[name].deps.push(...deps.map(depname => getModule(depname, [], [modules[name]])));

        return modules[name];
    }

    function collectDeps(alias, aliasAsPath, isKnown) {
        var result = [],
            path = aliasAsPath ? alias : $.breeze.jsconfig[alias]?.path || alias,
            imports = aliasAsPath ? [] : $.breeze.jsconfig[alias]?.import || [],
            index = imports.indexOf(alias),
            [bundle, lastIndex] = path.split('*'),
            dep;

        if (lastIndex) {
            lastIndex = parseInt(lastIndex, 10) || 0;
            bundle = bundlePrefix + bundle;
            path = bundle + (lastIndex || '');
            imports = imports.concat(_.range(0, lastIndex).map(i => bundle + (i || '')));
        }

        dep = getModule(alias);
        if (aliasAsPath && dep.path !== path) {
            dep = getModule(alias + origSuffix);
        }

        if (dep.collectedDeps) {
            return dep.collectedDeps;
        }

        imports.forEach((item, i) => {
            result.push(...collectDeps(item, i === index, true));
        });

        // When 'quickSearch' is required, resolve 'smileEs.quickSearch' too.
        Object.keys($.breeze.jsconfig).filter(key => key.endsWith(`.${alias}`)).forEach(key => {
            result.push(...collectDeps(key));
        });

        Object.entries($.breeze.jsconfig).filter(([k]) => k.includes('*')).some(([k, v]) => {
            if (alias.startsWith(k.split('*').at(0))) {
                (v.import || []).filter(key => key !== alias).forEach(key => {
                    result.push(...collectDeps(key));
                });
            }
        });

        if (isKnown || $.breeze.jsconfig[dep.name]?.path) {
            dep.path = path;
        } else if (config.paths[alias] || alias.includes('//')) {
            dep.path = alias;
        } else if (!dep.path && !dep.named) {
            dep.unknown = true;
            dep.loaded = true;
        }

        result.push(dep);
        dep.collectedDeps = result;

        return result;
    }

    function resolveRelativePath(moduleName, relativePath) {
        var basePath, parts;

        if (!relativePath.startsWith('.')) {
            return relativePath;
        }

        basePath = getModule(moduleName).path;
        parts = basePath.split('/').slice(0, -1);

        for (const seg of relativePath.split('/')) {
            if (seg === '.' || seg === '') {
                continue;
            } else if (seg === '..') {
                parts.pop();
            } else {
                parts.push(seg);
            }
        }

        return parts.join('/');
    }

    window.require = function (deps, cb, extra) {
        var mod,
            depsWithImports = [],
            scriptName = $(document.currentScript).data('name'),
            isBundle = isRunningFromBundle(),
            bundlePath = isBundle ? document.currentScript?.src.match(bundlePathRe)?.groups.path : undefined,
            name = isBundle ? undefined : scriptName;

        if (typeof deps === 'string' && typeof extra === 'function') {
            // define('name', [], () => {})
            mod = getModule(deps, cb, extra);
            mod.named = true;
            return mod;
        }

        if (typeof deps === 'string') {
            name = resolveRelativePath(name, deps);
            if (!modules[name]) {
                throw new Error(`Module name "${name}" has not been loaded yet. Use require([])`);
            }
            deps = [];
        } else if (typeof deps === 'function') {
            cb = deps;
            deps = ['require'];
        }

        deps = deps.map(dep => resolveRelativePath(name, dep));

        // A fix for inline nested `require([], () => { require(...) })` call.
        if (!window.require.ready && !deps.every?.(arg => $.breezemap[arg])) {
            return window.required.push([deps, cb, extra]);
        }

        if ((modules[name]?.cb || modules[name]?.ran) && cb) {
            name = `__module-${$.guid++}`;
        }

        mod = getModule(name || `__module-${$.guid++}`, deps, cb);
        deps.forEach(depname => depsWithImports.push(...collectDeps(depname)));
        depsWithImports.filter(dep => dep.global()).map(dep => dep.run());

        if (bundlePath) {
            depsWithImports = depsWithImports.filter(dep => !dep.name.includes(bundlePath));
        }

        depsWithImports = depsWithImports
            .filter(dep => !dep.loaded && (dep.path || dep.named) && dep.name !== scriptName)
            .map(dep => {
                if (dep.path?.includes('//')) {
                    if (dep.path.endsWith('.js') || dep.path.endsWith('/') || dep.path.includes('?')) {
                        dep.url = dep.path;
                    } else {
                        dep.url = dep.path + '.js';
                    }
                } else if (dep.path) {
                    dep.url = window.require.toUrl(dep.path);

                    if (!dep.name.startsWith('text!')) {
                        if (dep.path.endsWith('.min')) {
                            dep.url += '.js';
                        } else if (!dep.path.endsWith('.js')) {
                            dep.url += jsSuffix;
                        }
                    }
                }

                return dep;
            });

        if (cb && cb.length && deps.length) {
            deps.some((depname, i) => {
                if (i >= cb.length) {
                    return true;
                }
                modules[depname] && (modules[depname].waitForResult = true);
            });
        }

        lastDefines.push(depsWithImports.filter(dep => dep.url).length > 0);

        Promise.all(
                depsWithImports
                    .filter(dep => dep.url && !dep.name.startsWith('text!'))
                    .map(dep => $.preloadScript(dep.url))
            )
            .then(async () => {
                for (const dep of depsWithImports) {
                    loadingCount++;

                    if (dep.name.startsWith('text!')) {
                        var el = $('#' + dep.path.replace(/[/.]/g, '_'));

                        if (el.length) {
                            dep.cb = () => el.html();
                        } else {
                            if (!htmls[dep.url]) {
                                htmls[dep.url] = $.get(dep.url);
                            }

                            await htmls[dep.url].then(res => {
                                dep.cb = () => res;
                            }).catch(e => console.error(e));
                        }
                    } else if (dep.url) {
                        await $.loadScript({
                            'src': dep.url,
                            'data-name': dep.name
                        }).catch(e => console.error(e));
                    }

                    loadingCount--;
                    dep.run();
                }
            });

        return mod.run();
    };
    window.require.async = (deps) => new Promise(resolve => {
        var isMultipleDeps = _.isArray(deps);

        if (!isMultipleDeps) {
            deps = [deps];
        }

        return require(deps, (...args) => {
            resolve(isMultipleDeps ? args : args[0]);
        });
    });

    window.define = window.requirejs = window.require;
    window.require.defined = (name) => getModule(name).loaded;
    window.require.toUrl = (path) => {
        if (config.paths[path]) {
            path = config.paths[path];
        }

        if (path.includes(':') || path.startsWith('/')) {
            return path;
        }

        return window.VIEW_URL + '/' + path;
    };
    window.require.config = (cfg) => $.extend(true, config, cfg || {});

    $.breezemap.require = window.require;
    aliases = Object.keys($.breezemap);
    $.breezemap = new Proxy($.extend($.breezemap, {
        __counter: 1,
        __aliases: {},
        __getAll: () => ({ ...$.breezemap }),
        __get: key => $.breezemap[key],
        __has: key => key in $.breezemap,
        __lastComponent: (offset = 0) => $.breezemap[`__component${$.breezemap.__counter - 1 - offset}`],
        __register: (name, oldName) => {
            if ($.breezemap[name]) {
                return;
            }

            if (!oldName || _.isNumber(oldName)) {
                if (isRunningFromBundle() && lastDefines.at(-2)) {
                    console.error(
                        // eslint-disable-next-line max-len
                        `Trying to register previous cmp as ${name}, but previous define was async and not yet resolved. ` +
                        // eslint-disable-next-line max-len
                        'Make sure all of unknown dependencies of previous cmp are listed in "import" section of breeze_default.xml'
                    );
                }

                $.breezemap[name] = $.breezemap.__lastComponent(oldName);
            } else if ($.breezemap[oldName] !== undefined) {
                $.breezemap[name] = $.breezemap[oldName];
            }
        }
    }), {
        set(obj, alias, value) {
            obj[alias] = value;

            if ($.mixin?.pending[alias]) {
                $.mixin.pending[alias].forEach(args => $.mixin(...args));
                delete $.mixin.pending[alias];
            }

            getModule(alias).run();
            $(document).trigger('breeze:component:load', { alias, value });
            $(document).trigger('breeze:component:load:' + alias, { value });

            return true;
        }
    });
    aliases.forEach(alias => getModule(alias).run());
})();
