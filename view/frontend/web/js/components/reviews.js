/* global breeze customerData $t */
(function () {
    'use strict';

    // Review List
    breeze.widget('ajaxReviews', {
        /** Create widget */
        create: function () {
            var self = this,
                reviewTab = $(this.options.reviewsTabSelector);

            if (!reviewTab.length) {
                this.loadReviews();
            } else if (reviewTab.attr('role') === 'tab' && reviewTab.hasClass('active')) {
                this.loadReviews();
            } else {
                reviewTab.one('beforeOpen', function () {
                    self.loadReviews();
                });
            }

            $(document).on('click', '[data-role="product-review"] .pages a', function (event) {
                event.preventDefault();
                self.loadReviews(this.href).then(function () {
                    $('#reviews').get(0).scrollIntoView();
                });
            });
        },

        /** [loadReviews description] */
        loadReviews: function (href) {
            return breeze.request.get({
                url: href || this.options.productReviewUrl,
                type: 'html'
            }).then(function (response) {
                $('#product-review-container').html('').append(response.text).trigger('contentUpdated');
            });
        }
    });

    $(document).on('breeze:mount:Magento_Review/js/process-reviews', function (event) {
        $(event.detail.settings.reviewsTabSelector).ajaxReviews(event.detail.settings);
    });

    // Review Form
    breeze.view('reviewForm', {
        /** Init component */
        create: function () {
            this.review = customerData.get('review');
        },

        /** Get nickname for the customer */
        nickname: function () {
            return this.review().nickname || customerData.get('customer')().firstname;
        }
    });

    $(document).on('breeze:mount:Magento_Review/js/view/review', function (event) {
        $(event.detail.el).reviewForm(event.detail.settings);
    });

    breeze.validator.validators['rating-required'] = [
        function (value) {
            return value !== undefined;
        },
        $t('Please select one of each of the ratings above.')
    ];

    $(document).on('breeze:mount:Magento_Review/js/validate-review', function (event) {
        $(event.detail.el).validator({
            /** Disable button to prevent multiple submits */
            onValid: function () {
                this.form.find('.submit').prop('disabled', true);
            },

            /** Override error placement */
            addErrorNodes: function (el, nodes) {
                var reviewTable = $(el).parents('#product-review-table');

                if (reviewTable.length) {
                    reviewTable.after(nodes);
                } else {
                    this.addErrorNodes(el, nodes);
                }
            },

            /** Override error removal */
            removeErrorNodes: function (el) {
                var reviewTable = $(el).parents('#product-review-table');

                if (reviewTable.length) {
                    reviewTable.siblings('.error-text[generated]').remove();
                } else {
                    this.removeErrorNodes(el);
                }
            }
        });
    });
})();
