/* global breeze _ */
(function () {
    'use strict';

    breeze.widget('quickSearch', {
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
                });

            $(document).on('click.quickSearch', function (event) {
                if (self.element.has(event.target).length ||
                    self.autoComplete.has(event.target).length
                ) {
                    return clearTimeout(self.blurTimeout);
                }

                self.hideAutocomplete();
            });
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

            if (!this.element.isInViewport() || !this.element.isVisible()) {
                setTimeout(function () {
                    el.selectionStart = 10000;
                    el.selectionEnd = 10000;
                }, 13);
            }

            this.searchForm.toggleClass('active', isActive);
            this.searchLabel.toggleClass('active', isActive);
            this.element.attr('aria-expanded', isActive);

            if (isActive) {
                clearTimeout(this.blurTimeout);

                if (this.responseList.indexList) {
                    this.showAutocomplete();
                } else if (this.element.val()) {
                    this.debouncedRequest();
                }
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

            if (selected && selected.title) {
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
            var keyCode = e.keyCode || e.which;

            if (e.ctrlKey || e.altKey || e.shiftKey && keyCode !== $.key.TAB) {
                return;
            }

            if ([$.key.HOME, $.key.END, $.key.DOWN, $.key.UP, $.key.TAB].indexOf(keyCode) !== -1) {
                if (!this.autoComplete.visible().length) {
                    return;
                }

                e.preventDefault(); // prevent page scrolling
            }

            switch (keyCode) {
                case $.key.HOME:
                    this._selectEl(this._getFirstVisibleElement(), true);
                    break;

                case $.key.END:
                    this._selectEl(this._getLastElement(), true);
                    break;

                case $.key.DOWN:
                    this._selectNextEl(true);
                    break;

                case $.key.TAB:
                    if (e.shiftKey) {
                        this._selectPrevEl(true);
                    } else {
                        this._selectNextEl(true);
                    }
                    break;

                case $.key.UP:
                    this._selectPrevEl(true);
                    break;

                case $.key.ESCAPE:
                    this.element.focus();
                    this.hideAutocomplete();
                    break;

                default:
                    this.element.focus();
                    break;
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

            return breeze.request.get({
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

            this.element
                .focus()
                .removeAttr('aria-activedescendant');

            if (this.responseList.indexList.length) {
                this._updateAriaHasPopup(true);
            } else {
                this._updateAriaHasPopup(false);
            }
        },

        /** [showAutocomplete description] */
        showAutocomplete: function (content) {
            if (!content && this.autoComplete.visible().length) {
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

    $(document).on('breeze:mount:quickSearch', function (event, data) {
        $(data.el).quickSearch(data.settings);
    });
})();
