(() => {
    'use strict';

    var modules = {},
        lastDefines = [],
        loadingCount = 0,
        config = {
            paths: {},
            shim: {},
        },
        autoloadedBundles = {},
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

    function run() {
        if (this.ran || this.deps.some(dep => !dep.loaded)) {
            return this.result;
        }

        this.ran = true;
        this.result = this.cb?.apply(window, this.deps.map(dep => dep.run()));
        this.loaded = true;

        if (this.result === undefined && config.shim[this.name]?.exports) {
            this.result = _.get(window, config.shim[this.name].exports.split('.'));
        }

        if (this.result?.component) {
            $.breezemap[this.result?.component] = this.result;
        } else if (this.result === undefined && $.breezemap.__get(this.name)) {
            this.result = $.breezemap.__get(this.name);
        }

        if ($.breeze.jsconfig[this.name]?.bundle && !autoloadedBundles[$.breeze.jsconfig[this.name].bundle]) {
            autoloadedBundles[$.breeze.jsconfig[this.name].bundle] = true;
            $(document).trigger('bundle:autoload', $.breeze.jsconfig[this.name].bundle);
        }

        if (this.result !== undefined && !(this.result instanceof $)) {
            [this.name].forEach(alias => {
                if (alias.endsWith('-orig')) {
                    alias = alias.slice(0, -5);
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

        if (this.result === undefined && this.unknown && window.location.search.includes('breeze=1')) {
            console.log(this.name);
        }

        return this.result;
    }

    function getModule(name, deps = [], parents = [], cb) {
        if (typeof parents === 'function') {
            cb = parents;
            parents = [];
        }

        modules[name] = modules[name] || {
            name,
            parents: [],
            deps: [],
            run
        };
        modules[name].cb = modules[name].cb || cb;
        modules[name].parents.push(...parents);
        modules[name].deps.push(...deps.map(depname => getModule(depname, [], [modules[name]])));

        if (!modules[name].path) {
            if ($.breeze.jsconfig[name]) {
                modules[name].path = $.breeze.jsconfig[name].path;
            } else if (name.startsWith('text!')) {
                modules[name].path = name.substr(5);
            }
        }

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
            dep = getModule(alias + '-orig');
        }

        imports.forEach((item, i) => {
            result.push(...collectDeps(item, i === index, true));
        });

        // When 'quickSearch' is required, resolve 'smileEs.quickSearch' too.
        Object.keys($.breeze.jsconfig).filter(key => key.endsWith(`.${alias}`)).forEach(key => {
            result.push(...collectDeps(key));
        });

        if (isKnown || $.breeze.jsconfig[dep.name]?.path) {
            dep.path = path;
        } else if (config.paths[alias] || alias.includes('//')) {
            dep.path = alias;
        } else if (!dep.path) {
            dep.unknown = true;
            dep.loaded = true;
        }

        result.push(dep);

        return result;
    }

    window.require = function (deps, cb) {
        var mod,
            depsWithImports = [],
            scriptName = $(document.currentScript).data('name'),
            name = isRunningFromBundle() ? undefined : scriptName;

        if (typeof deps === 'string') {
            name = deps;
            deps = [];
        } else if (typeof deps === 'function') {
            cb = deps;
            deps = ['require'];
        }

        if ((modules[name]?.cb || modules[name]?.ran) && cb) {
            name = `__module-${$.guid++}`;
        }

        mod = getModule(name || `__module-${$.guid++}`, deps, cb);
        deps.forEach(depname => depsWithImports.push(...collectDeps(depname)));
        depsWithImports = depsWithImports.filter(dep => !dep.loaded && dep.path && dep.name !== scriptName);
        depsWithImports.forEach(dep => {
            if (dep.path.includes('//')) {
                if (dep.path.endsWith('.js') || dep.path.endsWith('/') || dep.path.includes('?')) {
                    dep.url = dep.path;
                } else {
                    dep.url = dep.path + '.js';
                }
            } else {
                dep.url = window.require.toUrl(dep.path);
            }
        });

        if (cb && cb.length && deps.length) {
            deps.some((depname, i) => {
                if (i >= cb.length) {
                    return true;
                }
                modules[depname] && (modules[depname].waitForResult = true);
            });
        }

        lastDefines.push(depsWithImports.length > 0);

        Promise.all(
                depsWithImports
                    .filter(dep => !dep.name.startsWith('text!'))
                    .map(dep => $.preloadScript(dep.url))
            )
            .then(async () => {
                for (const dep of depsWithImports) {
                    if (dep.name.startsWith('text!')) {
                        var el = $('#' + dep.path.replace(/[/.]/g, '_'));

                        if (el.length) {
                            dep.cb = () => el.html();
                        } else {
                            loadingCount++;
                            await $.get(dep.url).then(res => {
                                dep.cb = () => res.body;
                            }).catch(e => console.error(e));
                            loadingCount--;
                        }

                        dep.run();

                        continue;
                    }

                    loadingCount++;
                    await $.loadScript({
                        'src': dep.url,
                        'data-name': dep.name
                    }, () => dep.run()).catch(e => console.error(e));
                    loadingCount--;
                }
            });

        return mod.run();
    };

    window.define = window.requirejs = window.require;
    window.require.toUrl = (path) => {
        if (config.paths[path]) {
            return config.paths[path];
        }

        if (path.includes('//')) {
            return path;
        }

        if (path.endsWith('.min')) {
            path += '.js';
        } else if (!path.endsWith('.min.js') &&
            (path.endsWith('.js') || !path.split('/').at(-1).includes('.'))
        ) {
            path = path.replace(/\.js$/, '');
            path += jsSuffix;
        }

        return window.VIEW_URL + '/' + path;
    };
    window.require.config = (cfg) => $.extend(true, config, cfg || {});

    $.breezemap = new Proxy({
        'jquery': $,
        'ko': ko,
        'knockout': ko,
        'underscore': _,
        'require': window.require,
        'mage/mage': $.mage,
        __counter: 1,
        __aliases: {},
        __getAll: () => ({ ...$.breezemap }),
        __get: key => $.breezemap[key],
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
    }, {
        set(obj, alias, value) {
            obj[alias] = value;

            if ($.mixin?.pending[alias]) {
                $.mixin.pending[alias].forEach(mixin => $.mixin(alias, mixin));
                delete $.mixin.pending[alias];
            }

            getModule(alias).run();
            $(document).trigger('breeze:component:load', { alias, value });

            return true;
        }
    });
})();
