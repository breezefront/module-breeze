/* global breeze _ */
(function () {
    'use strict';

    breeze.widget('quickSearch', {
        options: {
            autocomplete: 'off',
            minSearchLength: 3,
            responseFieldElements: 'ul li',
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
                selected: null
            };
            this.autoComplete = $(this.options.destinationSelector);
            this.searchForm = $(this.options.formSelector);
            this.submitBtn = this.searchForm.find(this.options.submitBtn)[0];
            this.searchLabel = this.searchForm.find(this.options.searchLabel);
            this.element.attr('autocomplete', this.options.autocomplete);

            if (this.element.get(0) === document.activeElement) {
                this.setActiveState(true);
            }

            if (!this.element.val()) {
                this.submitBtn.disabled = true;
            }

            this.searchLabel.on('click', function (event) {
                if (self.isActive()) {
                    event.preventDefault();
                }
            });

            this.element
                .on('blur', function () {
                    if (!self.isActive()) {
                        return;
                    }

                    setTimeout(function () {
                        if (self.autoComplete.hidden().length) {
                            self.setActiveState(false);
                        } else {
                            self.element.focus();
                        }

                        self.autoComplete.hide();
                        self._updateAriaHasPopup(false);
                    }, 250);
                })
                .on('focus', this.setActiveState.bind(this, true))
                .on('keydown', this._onKeyDown.bind(this))
                .on('input propertychange', _.debounce(
                    this._onPropertyChange.bind(this),
                    this.options.suggestionDelay
                ));

            this.searchForm.on('submit', function (event) {
                self._onSubmit(event);
                self._updateAriaHasPopup(false);
            });

            this.autoComplete
                .on('click', 'li', function (event) {
                    self._selectEl($(event.currentTarget));
                    self.searchForm.submit();
                })
                .on('mouseenter', 'li', function (event) {
                    self._selectEl($(event.target));
                    self.element.attr('aria-activedescendant', $(event.target).attr('id'));
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
            this.searchForm.toggleClass('active', isActive);
            this.searchLabel.toggleClass('active', isActive);
            this.element.attr('aria-expanded', isActive);
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
            this.responseList.selected = null;

            if (all === true) {
                this.responseList.indexList = null;
            }
        },

        /**
         * @param {Event} e
         */
        _onSubmit: function (e) {
            var value = this.element.val();

            if (typeof value === 'string' && !value) {
                e.preventDefault();
            }

            if (this.responseList.selected) {
                this.element.val(this.responseList.selected.find('.qs-option-name').text().trim());
            }
        },

        /** [_selectEl description] */
        _selectEl: function (el) {
            if (!el) {
                return;
            }

            if (this.responseList.selected) {
                this.responseList.selected.removeClass(this.options.selectClass);
            }

            el.addClass(this.options.selectClass);
            this.responseList.selected = el;
        },

        /**
         * @param {Event} e
         */
        _onKeyDown: function (e) {
            var keyCode = e.keyCode || e.which,
                el;

            if (e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }

            if ([$.key.HOME, $.key.END, $.key.DOWN, $.key.UP].indexOf(keyCode) !== -1) {
                e.preventDefault();
            }

            switch (keyCode) {
                case $.key.HOME:
                    this._selectEl(this._getFirstVisibleElement());
                    break;

                case $.key.END:
                    this._selectEl(this._getLastElement());
                    break;

                case $.key.DOWN:
                    el = this._getFirstVisibleElement();

                    if (this.responseList.selected && this.responseList.selected.next().length) {
                        el = this.responseList.selected.next();
                    }

                    this._selectEl(el);

                    break;

                case $.key.UP:
                    el = this._getLastElement();

                    if (this.responseList.selected && this.responseList.selected.prev().length) {
                        el = this.responseList.selected.prev();
                    }

                    this._selectEl(el);

                    break;

                case $.key.ESCAPE:
                    this._resetResponseList(true);
                    this.autoComplete.hide();
                    break;

                case $.key.ENTER:
                    if (this.element.val().length >= parseInt(this.options.minSearchLength, 10)) {
                        this.searchForm.submit();
                        e.preventDefault();
                    }
                    break;

                default:
                    return;
            }
        },

        /** [_onPropertyChange description] */
        _onPropertyChange: function () {
            var searchField = this.element,
                clonePosition = {
                    position: 'absolute',
                    width: searchField.outerWidth()
                },
                source = this.options.template,
                template = _.template(source),
                dropdown = $('<ul role="listbox"></ul>'),
                value = this.element.val();

            this.submitBtn.disabled = true;

            if (value.length < parseInt(this.options.minSearchLength, 10)) {
                return this._resetAutocomplete();
            }

            this.submitBtn.disabled = false;

            breeze.request.get({
                url: this.options.url,
                type: 'json',
                data: {
                    q: value
                }
            }).then(function (response) {
                var data = response.body;

                if (!data.length) {
                    return this._resetAutocomplete();
                }

                $.each(data, function (index, element) {
                    element.index = index;
                    dropdown.append(template({
                        data: element
                    }));
                });

                this._resetResponseList(true);

                this.responseList.indexList = this.autoComplete
                    .empty()
                    .append(dropdown)
                    .css(clonePosition)
                    .show()
                    .find(this.options.responseFieldElements)
                    .visible();

                this.element.removeAttr('aria-activedescendant');

                if (this.responseList.indexList.length) {
                    this._updateAriaHasPopup(true);
                } else {
                    this._updateAriaHasPopup(false);
                }
            }.bind(this));
        },

        /** [_resetAutocomplete description] */
        _resetAutocomplete: function () {
            this._resetResponseList(true);
            this.autoComplete.hide();
            this._updateAriaHasPopup(false);
            this.element.removeAttr('aria-activedescendant');
        }
    });

    $(document).on('breeze:mount:quickSearch', function (event, data) {
        $(data.el).quickSearch(data.settings);
    });
})();
