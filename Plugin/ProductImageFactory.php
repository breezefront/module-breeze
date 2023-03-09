<?php

namespace Swissup\Breeze\Plugin;

class ProductImageFactory
{
    private \Swissup\Breeze\Helper\Data $helper;

    private \Swissup\Breeze\Helper\Image $imageHelper;

    /**
     * @param \Swissup\Breeze\Helper\Data $helper
     * @param \Swissup\Breeze\Helper\Image $imageHelper
     */
    public function __construct(
        \Swissup\Breeze\Helper\Data $helper,
        \Swissup\Breeze\Helper\Image $imageHelper
    ) {
        $this->helper = $helper;
        $this->imageHelper = $imageHelper;
    }

    /**
     * Add srcset and sizes attributes
     *
     * @param \Magento\Catalog\Block\Product\ImageFactory $subject
     * @param \Magento\Catalog\Block\Product\Image $result
     * @param Product $product
     * @param string $imageId
     * @return \Magento\Catalog\Block\Product\Image
     */
    public function afterCreate(
        \Magento\Catalog\Block\Product\ImageFactory $subject,
        \Magento\Catalog\Block\Product\Image $result,
        \Magento\Catalog\Model\Product $product,
        string $imageId
    ) {
        // do not check enabled status to keep working on shopping cart page
        if (!$this->helper->isResponsiveImagesEnabled()) {
            return $result;
        }

        $attributes = $result->getCustomAttributes();

        if (!$attributes) {
            $attributes = [];
        }

        if (isset($attributes['srcset'])) {
            return $result;
        }

        $srcset = $this->imageHelper->getSrcset($product, $imageId);

        if (!$srcset) {
            return $result;
        }

        $attributes['srcset'] = $srcset;
        if ($sizes = $this->imageHelper->getSizes($imageId)) {
            $attributes['sizes'] = $sizes;
        }

        return $result->setCustomAttributes($attributes);
    }
}
