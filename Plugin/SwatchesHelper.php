<?php

namespace Swissup\Breeze\Plugin;

class SwatchesHelper
{
    /**
     * @var \Swissup\Breeze\Helper\Data
     */
    private $helper;

    /**
     * @var \Swissup\Breeze\Helper\Image
     */
    private $imageHelper;

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
     * @param \Magento\Swatches\Helper\Data $subject
     * @param array $result
     * @return array
     */
    public function afterGetProductMediaGallery(
        \Magento\Swatches\Helper\Data $subject,
        $result,
        \Magento\Catalog\Model\Product $product
    ) {
        if (!$result || empty($result['gallery'])) {
            return;
        }

        $baseImage = null;
        $mediaGallery = $product->getMediaGalleryEntries();
        $sizes = [
            'medium' => 'product_swatch_image_medium',
            'small' => 'product_swatch_image_small',
        ];

        foreach ($mediaGallery as $image) {
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
