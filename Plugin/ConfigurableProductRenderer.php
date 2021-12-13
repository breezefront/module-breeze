<?php

namespace Swissup\Breeze\Plugin;

class ConfigurableProductRenderer
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
     * @var \Magento\Framework\Serialize\Serializer\Json
     */
    private $json;

    /**
     * @var \Magento\ConfigurableProduct\Helper\Data
     */
    private $configurableHelper;

    /**
     * @param \Swissup\Breeze\Helper\Data $helper
     * @param \Swissup\Breeze\Helper\Image $imageHelper
     * @param \Magento\Framework\Serialize\Serializer\Json $json
     * @param \Magento\ConfigurableProduct\Helper\Data $configurableHelper
     */
    public function __construct(
        \Swissup\Breeze\Helper\Data $helper,
        \Swissup\Breeze\Helper\Image $imageHelper,
        \Magento\Framework\Serialize\Serializer\Json $json,
        \Magento\ConfigurableProduct\Helper\Data $configurableHelper
    ) {
        $this->helper = $helper;
        $this->imageHelper = $imageHelper;
        $this->json = $json;
        $this->configurableHelper = $configurableHelper;
    }

    public function afterGetJsonConfig(
        \Magento\Swatches\Block\Product\Renderer\Configurable $renderer,
        $result
    ) {
        if (!$result || !$this->helper->isResponsiveImagesEnabled()) {
            return $result;
        }

        $data = $this->json->unserialize($result);
        if (!$data || empty($data['images'])) {
            return $result;
        }

        foreach ($renderer->getAllowProducts() as $product) {
            $images = $product->getMediaGalleryEntries();
            if ($images instanceof \Magento\Framework\Data\Collection) {
                $images = $images->getItems();
            }
            $images = array_values($images);

            foreach ($images as $i => $image) {
                $data['images'][$product->getId()][$i]['srcset'] = [
                    'medium' => $this->imageHelper->getSrcset($image, 'product_page_image_medium'),
                    'small' => $this->imageHelper->getSrcset($image, 'product_swatch_image_small'),
                ];
            }
        }

        return $this->json->serialize($data);
    }
}
