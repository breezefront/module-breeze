((cash) => {
    class BreezeModule {
        constructor(name, loader) {
            this.name = name;
            this.loader = loader;
            this.$ = loader.$;
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

        addParents(parents) {
            this.parents.push(...parents);
        }

        addDependencies(dependencies) {
            this.dependencies.push(...dependencies);
        }

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
                this.$.breezemap[this.result.component] = this.result;
            }

            if (this.$.breezemap?.__get(this.name)) {
                this.result = this.$.breezemap.__get(this.name);
            }
        }

        handleAutoload() {
            const jsconfig = this.$.breeze?.jsconfig || {};
            const bundleName = jsconfig[this.name]?.bundle;

            if (bundleName && !this.loader.autoloadedBundles.has(bundleName)) {
                this.loader.autoloadedBundles.add(bundleName);
                this.$(document).trigger('bundle:autoload', bundleName);
            }
        }

        registerInBreezeMap() {
            if (this.result !== undefined && !(this.result instanceof this.$)) {
                [this.name].forEach(alias => {
                    let finalAlias = alias;

                    if (alias.endsWith('-orig')) {
                        finalAlias = alias.slice(0, -5);
                    } else if (alias.startsWith('__module-')) {
                        finalAlias = `__component${this.$.breezemap.__counter++}`;
                    }

                    if (!this.$.breezemap?.__get(finalAlias)) {
                        this.$.breezemap[finalAlias] = this.result;
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
                !this.$.breeze?.jsignore?.includes(this.name)) {

                const originalLimit = Error.stackTraceLimit;
                Error.stackTraceLimit = 100;

                console.groupCollapsed(this.name);
                console.log(new Error(`Unknown component ${this.name}`));
                console.groupEnd();

                Error.stackTraceLimit = originalLimit;
            }
        }
    }

    window.BreezeModule = BreezeModule;
})(window.cash || window.$);
