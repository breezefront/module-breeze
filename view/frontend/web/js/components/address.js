(function () {
    'use strict';

    $.widget('address', {
        component: 'address',
        options: {
            deleteConfirmMessage: $.__('Are you sure you want to delete this address?')
        },

        _create: function () {
            var options = this.options,
                addAddress = options.addAddress,
                deleteAddress = options.deleteAddress;

            if (addAddress) {
                $(document).on('click.address', addAddress, this._addAddress.bind(this));
            }

            if (deleteAddress) {
                $(document).on('click.address', deleteAddress, this._deleteAddress.bind(this));
            }
        },

        destroy: function () {
            $(document).off('click.address');
            this._super();
        },

        _addAddress: function () {
            $.breeze.visit(this.options.addAddressLocation);
        },

        _deleteAddress: function (e) {
            var self = this,
                id = $(e.target).parent().data('address') || $(e.target).data('address');

            require(['Magento_Ui/js/modal/confirm'], confirm => {
                confirm({
                    content: this.options.deleteConfirmMessage,
                    actions: {
                        confirm: function () {
                            $.breeze.visit(
                                self.options.deleteUrlPrefix +
                                id +
                                '/form_key/' +
                                $.cookies.get('form_key')
                            );
                        }
                    }
                });
            });

            return false;
        }
    });
})();
