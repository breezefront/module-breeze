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
                $(document).on('click.address', addAddress, this._addAddress.bind(this));
            }

            if (deleteAddress) {
                $(document).on('click.address', deleteAddress, this._deleteAddress.bind(this));
            }
        },

        /** [destroy description] */
        destroy: function () {
            $(document).off('click.address');
            this._super();
        },

        /** [_addAddress description] */
        _addAddress: function () {
            window.breeze.visit(this.options.addAddressLocation);
        },

        /** [_deleteAddress description] */
        _deleteAddress: function (e) {
            var self = this,
                id = $(e.target).parent().data('address') || $(e.target).data('address');

            $.confirm({
                content: this.options.deleteConfirmMessage,
                actions: {
                    /** [confirm description] */
                    confirm: function () {
                        window.breeze.visit(
                            self.options.deleteUrlPrefix +
                            id +
                            '/form_key/' +
                            $.cookies.get('form_key')
                        );
                    }
                }
            });

            return false;
        }
    });
})();
