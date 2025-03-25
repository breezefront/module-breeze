(() => {
    'use strict';

    $.widget('lineClamp', {
        component: 'lineClamp',
        options: {
            collapsible: false,
            textExpand: $t('Show more'),
            textCollapse: $t('Show less'),
        },

        create() {
            this.textExpand = this.element.data('text-expand') || this.options.textExpand;
            this.textCollapse = this.element.data('text-collapse') || this.options.textCollapse;

            this.prepareMarkup();
            this.refresh();
            new ResizeObserver(this.refresh.bind(this)).observe(this.element[0]);

            this._on('click .clamp-toggle', (e) => {
                e.preventDefault();
                this.toggle();
            });
        },

        prepareMarkup() {
            this.toggler = this.element.find('.clamp-toggle');
            if (!this.toggler.length) {
                this.toggler = $(
                    `<a href="#" class="clamp-toggle"><span>${this.textExpand}</span></a>`
                ).prependTo(this.element);
            }
        },

        refresh() {
            var isFullyVisible = this.element.hasClass('expanded') ||
                this.element[0].scrollHeight === this.element[0].clientHeight;

            // hide toggler if content is fully visible without expanding
            if (!this.element.hasClass('expanded') && isFullyVisible) {
                return this.toggler.hide();
            }

            this.toggler.show().find('span').text(isFullyVisible ? this.textCollapse : this.textExpand);
            this.element.toggleClass('expanded', isFullyVisible);

            if (isFullyVisible && !this.options.collapsible) {
                this.toggler.hide();
            }
        },

        toggle() {
            if (this.element.hasClass('expanded')) {
                this.collapse();
            } else {
                this.expand();
            }
        },

        expand() {
            this.element.addClass('expanded');
        },

        collapse() {
            this.element.removeClass('expanded');
            this.refresh(); // in case if toggler shouldn't be visible
        }
    });
})();
