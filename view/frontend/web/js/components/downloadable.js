(() => {
    'use strict';

    $.mixin('downloadable', {
        _options: function (parent, options) {
            options.linkElement = options.linkElement.replace(':checkbox', '[type="checkbox"]');
            return parent(options);
        }
    });
})();
