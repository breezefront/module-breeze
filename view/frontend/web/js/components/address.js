(function () {
    'use strict';

    $.widget('address', {
        component: 'address',
        options: {
            deleteConfirmMessage: $.__('Are you sure you want to delete this address?')
        },

        /** [_create description] */
        _create: function () {
            var options         = this.options,
                addAddress      = options.addAddress,
                deleteAddress   = options.deleteAddress;

            if (addAddress) {
                $(document).on('click', addAddress, this._addAddress.bind(this));
            }

            if (deleteAddress) {
                $(document).on('click', deleteAddress, this._deleteAddress.bind(this));
            }
        },

        /** [_addAddress description] */
        _addAddress: function () {
            window.location = this.options.addAddressLocation;
        },

        /** [_deleteAddress description] */
        _deleteAddress: function (e) {
            var self = this,
                id = $(e.target).parent().data('address') || $(e.target).data('address');

            // eslint-disable-next-line no-alert
            if (confirm(this.options.deleteConfirmMessage)) {
                window.location = self.options.deleteUrlPrefix +
                    id +
                    '/form_key/' +
                    $.cookies.get('form_key');
            }

            return false;
        }
    });
})();