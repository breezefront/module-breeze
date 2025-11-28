<?php

namespace Swissup\Breeze\Plugin;

class SwatchesHelper
{
    public function __construct(
        private \Swissup\Breeze\Helper\Data $helper,
        private \Swissup\Breeze\Helper\Image $imageHelper
    ) {
    }

    /**
     * @param \Magento\Swatches\Helper\Data $subject
     * @param array $result
     * @return array
     */
    public function afterGetProductMediaGallery(
        \Magento\Swatches\Helper\Data $subject,
        $result,
        \Magento\Catalog\Model\Product $product
    ) {
        if (!$result || empty($result['gallery']) || !$this->helper->isResponsiveImagesEnabled()) {
            return $result;
        }

        $baseImage = null;
        $mediaGallery = $product->getMediaGalleryEntries();
        if (!$mediaGallery) {
            return $result;
        }

        $sizes = [
            'medium' => 'product_swatch_image_medium',
            'small' => 'product_swatch_image_small',
        ];

        foreach ($mediaGallery as $image) {
            if ($image->getDisabled()) {
                continue;
            }

            if (!$baseImage || in_array('image', $image->getTypes(), true)) {
                $baseImage = $image;
            }

            foreach ($sizes as $size => $id) {
                $srcset = $this->imageHelper->getSrcset($image, $id);

                if ($srcset) {
                    $result['gallery'][$image->getId()]['srcset'][$size] = $srcset;
                    if ($baseImage === $image) {
                        $result['srcset'][$size] = $srcset;
                    }
                }
            }
        }

        return $result;
    }
}
