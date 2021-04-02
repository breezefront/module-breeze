/* global breeze $t */
(function () {
    'use strict';

    breeze.widget('dropdownDialog', {
        options: {
            triggerTarget: null,
            closeOnClickOutside: true,
            appendTo: 'body',
            defaultDialogClass: 'mage-dropdown-dialog',
            dialogClass: '',
            autoPosition: false,
            position: {},
            defaultButtons: [
                {
                    class: 'action close',
                    text: $t('Close'),

                    /** Click action. */
                    click: function () {
                        $(this).dropdownDialog('close');
                    }
                }
            ]
        },

        /** Init widget */
        create: function () {
            var self = this;

            self.status = false;
            self.dialog = $('<div class="ui-dialog" role="dialog">');
            self.dialog.addClass(self.options.defaultDialogClass);
            self.dialog.addClass(self.options.dialogClass);
            self.dialog.appendTo($(self.options.appendTo));
            self.dialog.hide();

            self.addButtons();

            if (self.options.shadowHinter) {
                self.hinter = $('<div class="' + self.options.shadowHinter + '">');
                $(self.element).append(self.hinter);
            }

            $(self.element).show().prependTo(self.dialog);

            if (self.options.closeOnClickOutside) {
                $(document.body).on('click', function (event) {
                    if (!self.status) {
                        return;
                    }

                    if ($(self.trigger).has(event.target).length) {
                        return;
                    }

                    if (self.dialog.has(event.target).length && !$(event.target).hasClass('close')) {
                        return;
                    }

                    self.close();
                });
            }
        },

        /** Add buttons panel */
        addButtons: function () {
            var self = this,
                pane = $('<div class="ui-dialog-buttonpane">'),
                buttonSet = $('<div class="ui-dialog-buttonset">');

            if (!this.options.buttons) {
                this.options.buttons = this.options.defaultButtons;
            } else if (!this.options.buttons.length) {
                return;
            }

            buttonSet.appendTo(pane);

            $.each(this.options.buttons, function () {
                var button = $('<button role="button" aria-disabled="false">');

                button
                    .addClass(this.class)
                    .html('<span class="ui-button-text">' + this.text + '</span>')
                    .on('click', this.click.bind(self.element))
                    .appendTo(buttonSet);
            });

            this.dialog.append(pane);
        },

        /** Change trigger in runtime. Used by MSRP in tier pricing */
        init: function () {
            var self = this;

            this.trigger = this.options.triggerTarget ? $(this.options.triggerTarget) : false;

            if (this.trigger) {
                $(this.trigger).off('click.dropdownDialog');
                $(this.trigger).on('click.dropdownDialog', function (event) {
                    event.preventDefault();
                    self.toggle();
                });
            }
        },

        /** Hide expanded menu's, remove event listeneres */
        destroy: function () {
            this.close();
        },

        /** Open dialog */
        open: function () {
            this.status = true;

            if (this.options.autoPosition && this.options.position.of) {
                this.updatePosition();
            }

            this.dialog.show();
            this.toggleClasses(true);

            this.closeHandler = this.close.bind(this);

            $(window).one('resize.dropdownDialog', this.closeHandler);

            this.element.trigger('dropdowndialogopen');
        },

        /** Close dialog */
        close: function () {
            this.status = false;

            this.dialog.hide();
            this.toggleClasses(false);

            $(window).off('resize.dropdownDialog', this.closeHandler);

            this.element.trigger('dropdowndialogclose');
        },

        /** [toggleClasses description] */
        toggleClasses: function (flag) {
            if (this.options.dialogContentClass) {
                this.element.toggleClass(this.options.dialogContentClass, flag);
            }

            if (this.options.triggerClass && this.trigger) {
                $(this.trigger).toggleClass(this.options.triggerClass, flag);
            }

            if (this.options.parentClass) {
                $(this.options.appendTo).toggleClass(this.options.parentClass, flag);
            }

            if (this.options.bodyClass) {
                $('body').toggleClass(this.options.bodyClass, flag);
            }
        },

        /** Toggle dialog */
        toggle: function () {
            if (this.status) {
                this.close();
            } else {
                this.open();
            }
        },

        /** Update dialog coords */
        updatePosition: function () {
            var target = this.options.position.of,
                targetCoords = target.offset(),
                viewportWidth = $(document.body).width(),
                offset, width, left, diff;

            this.hinter.css('left', '');
            this.dialog.css({
                    position: '',
                    left: '',
                    top: ''
                })
                .show();

            offset = this.dialog.offset();
            width = this.dialog.width();

            if (!this.status) {
                this.dialog.hide();
            }

            left = targetCoords.left;
            diff = left + width - viewportWidth;

            if (diff > 0) {
                left -= diff;

                if (this.hinter) {
                    this.hinter.css('left', this.hinter.position().left + diff);
                }
            }

            this.dialog.css({
                position: 'relative',
                left: left,
                top: targetCoords.top - offset.top + target.height()
            });
        }
    });

    $(document).on('breeze:mount:dropdownDialog', function (event) {
        $(event.detail.el).dropdownDialog(event.detail.settings);
    });
})();
