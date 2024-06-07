define(['tabs'], (tabs) => {
    'use strict';

    $.widget('accordion', tabs, {
        component: 'accordion',
        options: {
            collapsible: true
        }
    });

    $.breezemap['mage/accordion'] = $.breezemap['accordion'];
});
