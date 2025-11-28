<?php

namespace Swissup\Breeze\Plugin;

class ConfigurableProductRenderer
{
    public function __construct(
        private \Swissup\Breeze\Helper\Data $helper,
        private \Swissup\Breeze\Helper\Image $imageHelper,
        private \Magento\Framework\Serialize\Serializer\Json $json
    ) {
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
            if (!$images) {
                continue;
            }

            if ($images instanceof \Magento\Framework\Data\Collection) {
                $images = $images->getItems();
            }
            $images = array_values($images);

            foreach ($images as $i => $image) {
                if (!empty($image['disabled']) || empty($data['images'][$product->getId()][$i])) {
                    continue;
                }

                $data['images'][$product->getId()][$i]['srcset'] = [
                    'medium' => $this->imageHelper->getSrcset($image, 'product_page_image_medium'),
                    'small' => $this->imageHelper->getSrcset($image, 'product_swatch_image_small'),
                ];
            }
        }

        return $this->json->serialize($data);
    }
}
