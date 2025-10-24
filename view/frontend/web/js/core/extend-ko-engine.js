define([
    'ko',
    'ko/template/renderer'
], function (ko, renderer) {
    'use strict';

    var MagentoTemplateEngine, ObservableSource;

    ObservableSource = function (templateName) {
        this.templateName = templateName;
        this._data = {};
        this.nodes = ko.observable([]);
    };

    ko.utils.extend(ObservableSource.prototype, {
        data: function (key, value) {
            if (arguments.length === 1) {
                return this._data[key];
            }
            this._data[key] = value;
        }
    });

    MagentoTemplateEngine = function () {
        this.sources = {};
    };

    MagentoTemplateEngine.prototype = new ko.nativeTemplateEngine();
    MagentoTemplateEngine.prototype.constructor = MagentoTemplateEngine;

    ko.utils.extend(MagentoTemplateEngine.prototype, {
        makeTemplateSource: function (template) {
            if (typeof template == 'string') {
                if (!this.sources[template]) {
                    this.sources[template] = new ObservableSource(template);
                    renderer.render(template).then(rendered => {
                        this.sources[template].nodes(rendered);
                    });
                }
                return this.sources[template];
            } else if (template.nodeType === 1 || template.nodeType === 8) {
                return new ko.templateSources.anonymousTemplate(template);
            }
        },

        renderTemplateSource: function (templateSource) {
            return ko.utils.cloneNodes(templateSource.nodes());
        },

        renderTemplate: function (template, bindingContext, options, templateDocument) {
            var templateSource = this.makeTemplateSource(template, templateDocument, options, bindingContext);

            return this.renderTemplateSource(templateSource);
        }
    });

    ko.setTemplateEngine(new MagentoTemplateEngine);
});
