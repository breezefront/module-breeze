(function () {
    'use strict';

    $.widget('changeEmailPassword', {
        component: 'changeEmailPassword',
        options: {
            changeEmailSelector: '[data-role=change-email]',
            changePasswordSelector: '[data-role=change-password]',
            mainContainerSelector: '[data-container=change-email-password]',
            titleSelector: '[data-title=change-email-password]',
            emailContainerSelector: '[data-container=change-email]',
            newPasswordContainerSelector: '[data-container=new-password]',
            confirmPasswordContainerSelector: '[data-container=confirm-password]',
            currentPasswordSelector: '[data-input=current-password]',
            emailSelector: '[data-input=change-email]',
            newPasswordSelector: '[data-input=new-password]',
            confirmPasswordSelector: '[data-input=confirm-password]'
        },

        create: function () {
            this.element.on('change', this._checkChoice.bind(this));
            $(this.options.emailSelector).on('change keyup paste', this._updatePasswordFieldWithEmailValue.bind(this));
            this._checkChoice();
        },

        _checkChoice: function () {
            if ($(this.options.changeEmailSelector).is(':checked') &&
                $(this.options.changePasswordSelector).is(':checked')) {
                this._showAll();
            } else if ($(this.options.changeEmailSelector).is(':checked')) {
                this._showEmail();
            } else if ($(this.options.changePasswordSelector).is(':checked')) {
                this._showPassword();
            } else {
                this._hideAll();
            }
        },

        _showAll: function () {
            $(this.options.titleSelector).html(this.options.titleChangeEmailAndPassword);

            $(this.options.mainContainerSelector).show();
            $(this.options.emailContainerSelector).show();
            $(this.options.newPasswordContainerSelector).show();
            $(this.options.confirmPasswordContainerSelector).show();

            $(this.options.currentPasswordSelector).attr('data-validate', '{required:true}').prop('disabled', false);
            $(this.options.emailSelector).attr('data-validate', '{required:true}').prop('disabled', false);
            this._updatePasswordFieldWithEmailValue();
            $(this.options.confirmPasswordSelector).attr(
                'data-validate',
                '{required:true, equalTo:"' + this.options.newPasswordSelector + '"}'
            ).prop('disabled', false);
        },

        _hideAll: function () {
            $(this.options.mainContainerSelector).hide();
            $(this.options.emailContainerSelector).hide();
            $(this.options.newPasswordContainerSelector).hide();
            $(this.options.confirmPasswordContainerSelector).hide();

            $(this.options.currentPasswordSelector).removeAttr('data-validate').prop('disabled', true);
            $(this.options.emailSelector).removeAttr('data-validate').prop('disabled', true);
            $(this.options.newPasswordSelector).removeAttr('data-validate').prop('disabled', true);
            $(this.options.confirmPasswordSelector).removeAttr('data-validate').prop('disabled', true);
        },

        _showEmail: function () {
            this._showAll();
            $(this.options.titleSelector).html(this.options.titleChangeEmail);

            $(this.options.newPasswordContainerSelector).hide();
            $(this.options.confirmPasswordContainerSelector).hide();

            $(this.options.newPasswordSelector).removeAttr('data-validate').prop('disabled', true);
            $(this.options.confirmPasswordSelector).removeAttr('data-validate').prop('disabled', true);
        },

        _showPassword: function () {
            this._showAll();
            $(this.options.titleSelector).html(this.options.titleChangePassword);

            $(this.options.emailContainerSelector).hide();

            $(this.options.emailSelector).removeAttr('data-validate').prop('disabled', true);
        },

        _updatePasswordFieldWithEmailValue: function () {
            $(this.options.newPasswordSelector).attr(
                'data-validate',
                '{required:true, ' +
                '\'validate-customer-password\':true, ' +
                '\'password-not-equal-to-user-name\':\'' + $(this.options.emailSelector).val() + '\'}'
            ).prop('disabled', false);
        }
    });
})();
