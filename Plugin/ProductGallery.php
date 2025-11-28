<?php

namespace Swissup\Breeze\Plugin;

class ProductGallery
{
    public function __construct(
        private \Swissup\Breeze\Helper\Data $helper,
        private \Swissup\Breeze\Helper\Image $imageHelper
    ) {
    }

    /**
     * Add srcset to gallery data
     *
     * @param \Magento\Catalog\Block\Product\View\Gallery $subject
     * @param string $result
     * @return string
     */
    public function afterGetGalleryImagesJson(
        \Magento\Catalog\Block\Product\View\Gallery $subject,
        $result
    ) {
        if (!$result || !$this->helper->isEnabled() || !$this->helper->isResponsiveImagesEnabled()) {
            return $result;
        }

        $data = json_decode($result, true);
        if (!$data) {
            return $result;
        }

        $images = $subject->getGalleryImages();
        if ($images instanceof \Magento\Framework\Data\Collection) {
            $images = $images->getItems();
        }
        $images = array_values($images);

        foreach ($images as $i => $image) {
            if (!isset($data[$i]) || isset($data[$i]['srcset'])) {
                continue;
            }

            $data[$i]['srcset'] = [
                'medium' => $this->imageHelper->getSrcset($image, 'product_page_image_medium'),
                'small' => $this->imageHelper->getSrcset($image, 'product_page_image_small'),
            ];
        }

        return json_encode($data);
    }
}
