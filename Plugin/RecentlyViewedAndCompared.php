<?php

namespace Swissup\Breeze\Plugin;

class RecentlyViewedAndCompared
{
    private \Swissup\Breeze\Helper\Data $helper;

    /**
     * @param \Swissup\Breeze\Helper\Data $helper
     */
    public function __construct(
        \Swissup\Breeze\Helper\Data $helper
    ) {
        $this->helper = $helper;
    }

    /**
     * @param \Magento\Widget\Block\BlockInterface $subject
     * @param string $result
     * @return string
     */
    public function afterGetTemplate(
        \Magento\Widget\Block\BlockInterface $subject,
        $result
    ) {
        if (!$this->helper->isEnabled()) {
            return $result;
        }

        $this->prepareBlockData($subject, $result);

        return 'Swissup_Breeze::catalog/recent-products.phtml';
    }

    /**
     * @param \Magento\Widget\Block\BlockInterface $subject
     * @param string $template
     */
    private function prepareBlockData($subject, $template)
    {
        if (strpos($template, 'viewed') !== false) {
            $title = __('Recently Viewed');
            $storage = 'recently_viewed_product';
            $additionalClasses = 'block-viewed-products-grid';
        } else {
            $title = __('Recently Compared');
            $storage = 'recently_compared_product';
            $additionalClasses = 'block-compared-products-grid';
        }

        $imageCode = $storage . 's_';

        if (strpos($template, 'list') !== false) {
            $displayMode = 'list';
            $imageCode .= 'list_content_widget';
        } elseif (strpos($template, 'sidebar') !== false) {
            $displayMode = 'list';
            $imageCode .= 'images_names_widget';
        } else {
            $displayMode = 'grid';
            $imageCode .= 'grid_content_widget';
        }

        $buttons = $subject->getShowButtons() ?: '';
        $buttons = explode(',', $buttons);
        $buttons = array_combine($buttons, $buttons);

        $attributes = $subject->getShowAttributes() ?: '';
        $attributes = explode(',', $attributes);
        $attributes = array_combine($attributes, $attributes);

        $subject->setBreezeConfig([
            'title' => $title,
            'component' => 'Swissup_Breeze/js/components/recent-products',
            'scope' => str_replace('\\', '_', $subject->getNameInLayout()),
            'storage' => $storage,
            'limit' => $subject->getPageSize() ?: 5,
            'displayMode' => $displayMode,
            'imageCode' => $imageCode,
            'buttons' => $buttons,
            'attributes' => $attributes,
            'additionalClasses' => $additionalClasses,
            'productCurrentScope' => $this->helper->getConfig(
                'catalog/recently_products/scope',
                \Magento\Store\Model\ScopeInterface::SCOPE_WEBSITE
            ),
        ]);
    }
}
