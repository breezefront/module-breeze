(function () {
    'use strict';

    $.widget('pagebuilderTabs', {
        component: 'Magento_PageBuilder/js/content-type/tabs/appearance/default/widget',

        create: function () {
            this.element.tabs({
                collapsibleElement: '[role=tab]',
                header: '[data-role=tab]',
                content: '[data-content-type="tab-item"]',
                trigger: '[data-role=tab]'
            });
        }
    });
})();
