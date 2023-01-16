/* global _ */
(function () {
    'use strict';

    $.widget('quickSearch', {
        component: 'quickSearch',
        options: {
            autocomplete: 'off',
            minSearchLength: 3,
            responseFieldElements: 'ul li',
            dropdown: '<ul role="listbox"></ul>',
            dropdownClass: '',
            itemClass: '',
            selectClass: 'selected',
            template:
                '<li class="<%- data.row_class %>" id="qs-option-<%- data.index %>" role="option">' +
                    '<span class="qs-option-name">' +
                       ' <%- data.title %>' +
                    '</span>' +
                    '<span aria-hidden="true" class="amount">' +
                        '<%- data.num_results %>' +
                    '</span>' +
                '</li>',
            formSelector: '#search_mini_form',
            destinationSelector: '#search_autocomplete',
            submitBtn: 'button[type="submit"]',
            searchLabel: '[data-role=minisearch-label]',
            suggestionDelay: 300,
            mediaBreakpoint: '(max-width: 768px)'
        },

        /** @inheritdoc */
        create: function () {
            var self = this;

            this.responseList = {
                indexList: null,
                selected: null,
                selectedIndex: null
            };
            this.dataset = [];
            this.autoComplete = $(this.options.destinationSelector);
            this.searchForm = $(this.options.formSelector);
            this.submitBtn = this.searchForm.find(this.options.submitBtn);
            this.searchLabel = this.searchForm.find(this.options.searchLabel);
            this.element.attr('autocomplete', this.options.autocomplete);
            this.debouncedRequest = _.debounce(
                this.sendRequest.bind(this),
                this.options.suggestionDelay
            );

            if (this.element.get(0) === document.activeElement) {
                this.setActiveState(true);
            }

            if (!this.element.val()) {
                this.submitBtn.prop('disabled', true);
            }

            this.searchLabel.on('click.quickSearch', function (event) {
                if (self.isActive()) {
                    event.preventDefault();
                } else {
                    // in case if element is hidden
                    self.element.focus();
                    self.setActiveState(true);
                }
            });

            this.element
                .on('keydown.quickSearch', this._onEnterKeyDown.bind(this))
                .on('focus.quickSearch', this.setActiveState.bind(this, true))
                .on('blur.quickSearch', this._onBlur.bind(this))
                .on('input.quickSearch propertychange.quickSearch', this.debouncedRequest);

            this.searchForm
                .on('keydown.quickSearch', this._onKeyDown.bind(this))
                .on('submit.quickSearch', function (event) {
                    self._onSubmit(event);
                    self._updateAriaHasPopup(false);
                });

            this.autoComplete
                .on('click.quickSearch', this.options.responseFieldElements, function () {
                    self._selectEl($(this));
                    self.submitSelectedItem();
                })
                .on('focus.quickSearch', this.options.responseFieldElements, function () {
                    self._selectEl($(this));
                });

            this._on(document, {
                /** [keydown description] */
                keydown: function (e) {
                    if (e.key === 'Escape') {
                        self.hideAutocomplete();
                    }
                }
            });

            $(document).on('click.quickSearch', function (event) {
                if (self.searchLabel.has(event.target).length) {
                    return;
                }

                if (self.element.has(event.target).length ||
                    self.autoComplete.has(event.target).length
                ) {
                    return clearTimeout(self.blurTimeout);
                }

                self.setActiveState(false);
                self.hideAutocomplete();
            });
        },

        destroy: function () {
            $(document).off('click.quickSearch');
            this._super();
        },

        /**
         * @returns {Boolean}
         */
        isActive: function () {
            return this.searchLabel.hasClass('active');
        },

        /**
         * @param {Boolean} isActive
         */
        setActiveState: function (isActive) {
            var el = this.element.get(0);

            this.searchForm.toggleClass('active', isActive);
            this.searchLabel.toggleClass('active', isActive);
            this.element.attr('aria-expanded', isActive);

            if (!isActive) {
                return;
            }

            if (!this.element.isInViewport() || !this.element.isVisible()) {
                setTimeout(function () {
                    el.selectionStart = 10000;
                    el.selectionEnd = 10000;
                }, 13);
            }

            clearTimeout(this.blurTimeout);

            if (this.responseList.indexList) {
                this.showAutocomplete();
            } else if (this.element.val()) {
                this.debouncedRequest();
            }
        },

        /** [submitSelectedItem description] */
        submitSelectedItem: function () {
            this.searchForm.submit();
        },

        /**
         * @return {Element}
         */
        _getFirstVisibleElement: function () {
            return this.responseList.indexList ? this.responseList.indexList.first() : false;
        },

        /**
         * @return {Element}
         */
        _getLastElement: function () {
            return this.responseList.indexList ? this.responseList.indexList.last() : false;
        },

        /**
         * @param {Boolean} show
         */
        _updateAriaHasPopup: function (show) {
            this.element.attr('aria-haspopup', show);
        },

        /**
         * Clears the item selected from the suggestion list and resets the suggestion list.
         * @param {Boolean} all - Controls whether to clear the suggestion list.
         */
        _resetResponseList: function (all) {
            if (this.responseList.selected) {
                this.responseList.selected.removeClass(this.options.selectClass);
            }

            this.responseList.selected = null;
            this.responseList.selectedIndex = null;

            if (all === true) {
                this.responseList.indexList = null;
            }
        },

        /**
         * @param {Event} e
         */
        _onSubmit: function (e) {
            var value = this.element.val(),
                selected = this.dataset[this.responseList.selectedIndex];

            if (typeof value === 'string' && !value) {
                e.preventDefault();
            }

            if (selected && selected.title && this.isVisibleAutocomplete()) {
                this.element.val(selected.title);
            }
        },

        /** [_onBlur description] */
        _onBlur: function () {
            var self = this;

            if (!self.isActive()) {
                return;
            }

            self.blurTimeout = setTimeout(function () {
                if (self.autoComplete.is(':focus-within')) {
                    return;
                }

                self.setActiveState(false);
                self.hideAutocomplete();
            }, 250);
        },

        /** [_selectEl description] */
        _selectEl: function (el, focus) {
            if (!el) {
                return;
            }

            if (this.responseList.selected) {
                this.responseList.selected.removeClass(this.options.selectClass);
            }

            el.addClass(this.options.selectClass);

            if (focus) {
                el.focus();
            }

            this.responseList.selected = el;
            this.responseList.selectedIndex = this.responseList.indexList.index(el);
        },

        /** [_selectNextEl description] */
        _selectNextEl: function (focus) {
            var index = this.responseList.selectedIndex,
                el = this._getFirstVisibleElement();

            if (index !== null && this.responseList.indexList[index + 1]) {
                el = $(this.responseList.indexList[index + 1]);
            }

            this._selectEl(el, focus);
        },

        /** [_selectPrevEl description] */
        _selectPrevEl: function (focus) {
            var index = this.responseList.selectedIndex,
                el = this._getLastElement();

            if (index !== null && this.responseList.indexList[index - 1]) {
                el = $(this.responseList.indexList[index - 1]);
            }

            this._selectEl(el, focus);
        },

        /**
         * @param {Event} e
         */
        _onKeyDown: function (e) {
            var navKeys = ['Home', 'End', 'ArrowDown', 'ArrowUp', 'Tab'],
                selected = this.responseList.selected,
                first = this._getFirstVisibleElement(),
                last = this._getLastElement();

            if (e.ctrlKey || e.altKey || e.shiftKey && e.key !== 'Tab') {
                return;
            }

            // disable focus-trap
            if (e.key === 'Tab') {
                if (e.shiftKey && this.element.is(':focus')) {
                    return;
                }

                if (selected && e.shiftKey && first && selected.has(first.get(0)).length ||
                    selected && !e.shiftKey && last && selected.has(last.get(0)).length
                ) {
                    return;
                }
            }

            if (navKeys.indexOf(e.key) !== -1) {
                if (!this.canUseNavKeys()) {
                    return;
                }

                e.preventDefault(); // prevent page scrolling
            }

            switch (e.key) {
                case 'Home':
                    this._selectEl(first, true);
                    break;

                case 'End':
                    this._selectEl(last, true);
                    break;

                case 'ArrowDown':
                    this._selectNextEl(true);
                    break;

                case 'Tab':
                    if (e.shiftKey) {
                        this._selectPrevEl(true);
                    } else {
                        this._selectNextEl(true);
                    }
                    break;

                case 'ArrowUp':
                    this._selectPrevEl(true);
                    break;

                case 'Escape':
                    if (this.isVisibleAutocomplete()) {
                        this.element.focus();
                        this.hideAutocomplete();
                    } else if (this.element.is(':focus')) {
                        this.element.blur();
                    }
                    break;

                default:
                    this.element.focus();
                    break;
            }
        },

        /** [canUseNavKeys description] */
        canUseNavKeys: function () {
            return this.isVisibleAutocomplete();
        },

        /** [isVisibleAutocomplete description] */
        isVisibleAutocomplete: function () {
            var autocomplete = this.autoComplete.not(':empty').visible();

            return autocomplete.length > 0 && autocomplete.css('visibility') !== 'hidden';
        },

        /** [_onEnterKeyDown description] */
        _onEnterKeyDown: function (e) {
            if (e.key === 'Enter' &&
                this.element.val().length >= this.options.minSearchLength
            ) {
                e.preventDefault();
                this.searchForm.submit();
            }
        },

        /** [sendRequest description] */
        sendRequest: function () {
            var value = this.element.val();

            this.submitBtn.prop('disabled', true);

            if (value.length < this.options.minSearchLength) {
                return this.resetAutocomplete();
            }

            this.submitBtn.prop('disabled', false);

            return $.request.get({
                url: this.options.url,
                type: 'json',
                data: {
                    q: value
                }
            }).then(function (response) {
                this.prepareResponse(response.body);
                this.processResponse();
            }.bind(this));
        },

        /** [prepareResponse description] */
        prepareResponse: function (data) {
            this.dataset = data;
        },

        /** [processResponse description] */
        processResponse: function () {
            var dropdown = $(this.options.dropdown);

            if (this.options.dropdownClass) {
                dropdown.addClass(this.options.dropdownClass);
            }

            if (!this.dataset.length) {
                return this.resetAutocomplete();
            }

            $.each(this.dataset, function (index, item) {
                item.index = index;
                dropdown.append(this.renderItem(item));
            }.bind(this));

            dropdown.children().addClass(this.options.itemClass);

            this._resetResponseList(true);

            this.showAutocomplete(dropdown);

            this.responseList.indexList = this.autoComplete
                .find(this.options.responseFieldElements)
                .visible();

            this.element.removeAttr('aria-activedescendant');

            if (this.responseList.indexList.length) {
                this._updateAriaHasPopup(true);
            } else {
                this._updateAriaHasPopup(false);
            }
        },

        /** [showAutocomplete description] */
        showAutocomplete: function (content) {
            if (!content && this.isVisibleAutocomplete()) {
                return;
            }

            if (content) {
                this.autoComplete.empty().append(content);
            }

            this.autoComplete
                .css({
                    position: 'absolute',
                    minWidth: this.element.outerWidth()
                })
                .show()
                .find(this.options.responseFieldElements)
                .attr('tabIndex', 0);
        },

        /** [showAutocomplete description] */
        hideAutocomplete: function () {
            this.autoComplete
                .hide()
                .find(this.options.responseFieldElements)
                .removeAttr('tabIndex');
        },

        /** [renderItem description] */
        renderItem: function (item) {
            return this.getItemTemplate(item)({
                data: item
            });
        },

        /** [getItemTemplate description] */
        getItemTemplate: function () {
            if (!this.template) {
                this.template = _.template(this.options.template);
            }

            return this.template;
        },

        /** [resetAutocomplete description] */
        resetAutocomplete: function () {
            this._resetResponseList(true);
            this.hideAutocomplete();
            this._updateAriaHasPopup(false);
            this.element.removeAttr('aria-activedescendant');
        }
    });
})();
