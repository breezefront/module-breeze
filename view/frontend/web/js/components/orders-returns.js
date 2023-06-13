(() => {
    'use strict';

    $.widget('ordersReturns', {
        component: 'ordersReturns',
        options: {
            zipCode: '#oar-zip',
            emailAddress: '#oar-email',
            searchType: '#quick-search-type-id'
        },

        _create: function () {
            $(this.options.searchType).on('change', this._showIdentifyBlock.bind(this)).trigger('change');
        },

        _showIdentifyBlock: function (e) {
            var value = $(e.target).val();

            $(this.options.zipCode).toggle(value === 'zip');
            $(this.options.emailAddress).toggle(value === 'email');
        }
    });
})();
