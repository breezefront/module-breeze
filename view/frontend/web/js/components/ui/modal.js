(function () {
    'use strict';

    $.widget('modal', {
        component: 'Magento_Ui/js/modal/modal',
        options: {
            type: 'popup',
            title: '',
            subTitle: '',
            modalClass: '',
            focus: '[data-role="closeBtn"]',
            autoOpen: false,
            clickableOverlay: true,
            popupTpl: $('#popupTpl').html(),
            slideTpl: $('#slideTpl').html(),
            customTpl: $('#customTpl').html(),
            modalVisibleClass: '_show',
            parentModalClass: '_has-modal',
            innerScrollClass: '_inner-scroll',
            responsive: false,
            innerScroll: false,
            modalTitle: '[data-role="title"]',
            modalSubTitle: '[data-role="subTitle"]',
            modalBlock: '[data-role="modal"]',
            modalCloseBtn: '[data-role="closeBtn"]',
            modalContent: '[data-role="content"]',
            modalAction: '[data-role="action"]',
            focusableScope: '[data-role="focusable-scope"]',
            focusableStart: '[data-role="focusable-start"]',
            focusableEnd: '[data-role="focusable-end"]',
            appendTo: 'body',
            wrapperClass: 'modals-wrapper',
            overlayClass: 'modals-overlay',
            responsiveClass: 'modal-slide',
            trigger: '',
            modalLeftMargin: 45,
            closeText: $.__('Close'),
            buttons: [{
                text: $.__('Ok'),
                class: '',
                attr: {},
                click: function (event) {
                    this.closeModal(event);
                }
            }],
            keyEventHandlers: {
                /**
                 * Escape key press handler,
                 * close modal window
                 * @param {Object} event - event
                 */
                escapeKey: function (event) {
                    if (this.options.isOpen && this.modal.has(document.activeElement).length ||
                        this.options.isOpen && this.modal[0] === document.activeElement) {
                        this.closeModal(event);
                    }
                }
            }
        },

        _create: function () {
            var listeners = {};

            _.bindAll(
                this,
                'keyEventSwitcher',
                'closeModal'
            );

            this.options.id = $.guid++;
            this._elMarkup = this.element.get(0).outerHTML;
            this._elParent = this.element.parent();
            this._createWrapper();
            this._renderModal();
            this._createButtons();
            this.focusTrap = this.createFocusTrap(this.modal);

            if (this.options.trigger) {
                listeners['click ' + this.options.trigger] = this.toggleModal.bind(this);
                this._on(document, listeners);
            }

            listeners = {
                'openModal': this.openModal,
                'closeModal': this.closeModal
            };
            listeners['click ' + this.options.modalCloseBtn] =
                this.options.modalCloseBtnHandler ? this.options.modalCloseBtnHandler : this.closeModal;

            this._on(this.modal, listeners);

            if (this.options.autoOpen) {
                this.openModal();
            }
        },

        destroy: function () {
            this.modalWrapper.remove();
            $(this.options.appendTo).removeClass(this.options.parentModalClass);
            this._elParent.append(this._elMarkup);
            this._super();
        },

        /**
         * Returns element from modal node.
         * @return {Object} - element.
         */
        _getElem: function (elem) {
            return this.modal.find(elem);
        },

        /**
         * @return {Number}
         */
        _getVisibleCount: function () {
            var modals = this.modalWrapper.find(this.options.modalBlock);

            return modals.filter('.' + this.options.modalVisibleClass).length;
        },

        /**
         * @return {Number}
         */
        _getVisibleSlideCount: function () {
            var elems = this.modalWrapper.find('[data-type="slide"]');

            return elems.filter('.' + this.options.modalVisibleClass).length;
        },

        /**
         * Listener key events.
         * Call handler function if it exists
         */
        keyEventSwitcher: function (event) {
            var key = event.key.toLowerCase() + 'Key';

            if (this.options.keyEventHandlers.hasOwnProperty(key)) {
                this.options.keyEventHandlers[key].apply(this, arguments);
            }
        },

        /**
         * @param {String} title
         */
        setTitle: function (title) {
            var $title = this.modal.find(this.options.modalTitle),
                $subTitle = this.modal.find(this.options.modalSubTitle);

            $title.text(title);
            $title.append($subTitle);
        },

        /**
         * @param {String} subTitle
         */
        setSubTitle: function (subTitle) {
            this.options.subTitle = subTitle;
            this.modal.find(this.options.modalSubTitle).html(subTitle);
        },

        toggleModal: function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }

            if (this.options.isOpen === true) {
                this.closeModal();
            } else {
                this.openModal();
            }
        },

        /**
         * @return {Element}
         */
        openModal: function () {
            if (this.options.isOpen) {
                return this.element;
            }

            this.options.isOpen = true;
            this._createOverlay();
            this._setActive();
            this._setKeyListener();
            this.modal.one('transitionend', this.focusTrap.activate);
            this.modal.one('transitionend', _.bind(this._trigger, this, 'opened'));
            this.modal.addClass(this.options.modalVisibleClass);

            return this.element;
        },

        /**
         * Set events listener when modal is opened.
         */
        _setKeyListener: function () {
            this.modal.on('keydown', this.keyEventSwitcher);
        },

        /**
         * Remove events listener when modal is closed.
         */
        _removeKeyListener: function () {
            this.modal.off('keydown', this.keyEventSwitcher);
        },

        /**
         * @return {Element}
         */
        closeModal: function () {
            var that = this;

            if (!this.options.isOpen) {
                return this.element;
            }

            this._removeKeyListener();
            this.options.isOpen = false;
            this.modal.one('transitionend', function () {
                that._close();
            });
            this.modal.removeClass(this.options.modalVisibleClass);

            return this.element;
        },

        /**
         * Helper for closeModal function.
         */
        _close: function () {
            var trigger = _.bind(this._trigger, this, 'closed', this.modal);

            this.focusTrap.deactivate();
            this._destroyOverlay();
            this._unsetActive();
            _.defer(trigger, this);
        },

        /**
         * Set z-index and margin for modal and overlay.
         */
        _setActive: function () {
            var zIndex = this.modal.zIndex(),
                baseIndex = zIndex + this._getVisibleCount();

            if (this.modal.data('active')) {
                return;
            }

            this.modal.data('active', true);

            this.overlay.zIndex(++baseIndex);
            this.prevOverlayIndex = this.overlay.zIndex();
            this.modal.zIndex(this.overlay.zIndex() + 1);

            if (this._getVisibleSlideCount()) {
                this.modal.css('marginLeft', this.options.modalLeftMargin * this._getVisibleSlideCount());
            }
        },

        /**
         * Unset styles for modal and set z-index for previous modal.
         */
        _unsetActive: function () {
            this.modal.removeAttr('style');
            this.modal.data('active', false);

            if (this.overlay) {
                this.overlay.zIndex(this.prevOverlayIndex - 1);
            }
        },

        _createWrapper: function () {
            this.modalWrapper = $(this.options.appendTo).find('.' + this.options.wrapperClass);

            if (!this.modalWrapper.length) {
                this.modalWrapper = $('<div></div>')
                    .addClass(this.options.wrapperClass)
                    .appendTo(this.options.appendTo);
            }
        },

        _renderModal: function () {
            $(
                _.template(this.options[this.options.type + 'Tpl'])({
                    data: this.options
                })
            ).appendTo(this.modalWrapper);

            this.modalWrapper.find(this.options.focusableStart).removeAttr('tabindex');
            this.modalWrapper.find(this.options.focusableEnd).removeAttr('tabindex');
            this.modal = this.modalWrapper.find(this.options.modalBlock).last();
            this.element.appendTo(this._getElem(this.options.modalContent));

            if (this.element.is(':hidden')) {
                this.element.show();
            }
        },

        _createButtons: function () {
            this.buttons = this._getElem(this.options.modalAction);
            _.each(this.options.buttons, function (btn, key) {
                var button = this.buttons[key];

                if (btn.attr) {
                    $(button).attr(btn.attr);
                }

                if (btn.class) {
                    $(button).addClass(btn.class);
                }

                if (!btn.click) {
                    btn.click = this.closeModal;
                }
                $(button).on('click', _.bind(btn.click, this));
            }, this);
        },

        _createOverlay: function () {
            var outerClickHandler = this.options.outerClickHandler || this.closeModal;

            this.overlay = $('.' + this.options.overlayClass);

            if (!this.overlay.length) {
                $.breeze.scrollbar.hide();

                $(this.options.appendTo).addClass(this.options.parentModalClass);

                this.overlay = $('<div></div>')
                    .addClass(this.options.overlayClass)
                    .appendTo(this.modalWrapper);
            }

            if (this.options.clickableOverlay) {
                this.overlay.off().on('click', outerClickHandler);
            }
        },

        _destroyOverlay: function () {
            if (!this._getVisibleCount()) {
                $(this.options.appendTo).removeClass(this.options.parentModalClass);
                this.overlay.remove();
                $.breeze.scrollbar.reset();
                this.overlay = null;
            }
        }
    });
})();
