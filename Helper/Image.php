<?php

namespace Swissup\Breeze\Helper;

use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\Product\Image\ParamsBuilder;
use Magento\Catalog\Model\View\Asset\ImageFactory;
use Magento\Catalog\Model\View\Asset\PlaceholderFactory;
use Magento\Framework\App\Helper\Context;
use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Framework\View\Layout;
use Magento\Framework\View\Page\Config;
use Swissup\Breeze\Helper\Data;

class Image extends AbstractHelper
{
    private $helper;

    private $imageParamsBuilder;

    private $viewAssetImageFactory;

    private $viewAssetPlaceholderFactory;

    private $layout;

    private $pageConfig;

    public function __construct(
        Context $context,
        Data $helper,
        ParamsBuilder $imageParamsBuilder,
        ImageFactory $viewAssetImageFactory,
        PlaceholderFactory $viewAssetPlaceholderFactory,
        Layout $layout,
        Config $pageConfig
    ) {
        parent::__construct($context);

        $this->helper = $helper;
        $this->imageParamsBuilder = $imageParamsBuilder;
        $this->viewAssetImageFactory = $viewAssetImageFactory;
        $this->viewAssetPlaceholderFactory = $viewAssetPlaceholderFactory;
        $this->layout = $layout;
        $this->pageConfig = $pageConfig;
    }

    /**
     * @param Product|\Magento\Framework\DataObject $object
     * @param string $id
     * @return string
     */
    public function getSrcset($object, $id)
    {
        $srcset = [];
        $srcsetParams = $this->getSrcsetParams($id);

        foreach ($srcsetParams as $params) {
            $params = $this->imageParamsBuilder->build($params);
            if (isset($srcset[$params['image_width']])) {
                continue;
            }

            if ($object instanceof Product) {
                $path = $object->getData($params['image_type']);
            } else {
                $path = $object->getData('file');
            }

            if (!$path || $path === 'no_selection') {
                continue;
            }

            $imageAsset = $this->viewAssetImageFactory->create([
                'miscParams' => $params,
                'filePath' => $path,
            ]);

            $srcset[$params['image_width']] = $imageAsset->getUrl() . ' ' . $params['image_width'] . 'w';
        }

        if (count($srcset) < 2) {
            return '';
        }

        ksort($srcset);

        return implode(',', $srcset);
    }

    /**
     * @param string $id
     * @return string
     */
    public function getSizes($id)
    {
        $sizes = array_merge(
            $this->helper->getConfig('design/breeze/sizes'),
            $this->helper->getThemeConfig('sizes') ?: []
        );

        $idWithLayout = $id . '-' . $this->getCurrentPageLayout();
        if (isset($sizes[$idWithLayout])) {
            return $sizes[$idWithLayout];
        }

        return $sizes[$id] ?? '';
    }

    /**
     * @return string
     */
    private function getCurrentPageLayout()
    {
        $currentPageLayout = $this->pageConfig->getPageLayout();

        if (!$currentPageLayout) {
            $currentPageLayout = $this->layout->getUpdate()->getPageLayout();
        }

        return $currentPageLayout;
    }

    /**
     * @param string $id
     * @return array
     */
    private function getSrcsetParams($id)
    {
        $images = $this->helper->getViewConfig()->getMediaEntities('Magento_Catalog', 'images');
        $params = $this->filterMediaEntities($images, $id);

        if (!$params || count($params) > 1) {
            return $params;
        }

        $params = array_values($params);
        $fallbacks = [
            'category_page_grid',
            'category_page_list',
        ];

        foreach ($fallbacks as $fallbackId) {
            $fallbackParams = $images[$fallbackId] ?? false;

            if (!$fallbackParams) {
                continue;
            }

            if ($params[0]['width'] === $fallbackParams['width'] &&
                $params[0]['height'] === $fallbackParams['height']
            ) {
                $params = $this->filterMediaEntities($images, $fallbackId);
                break;
            }
        }

        return $params;
    }

    /**
     * @param array $images
     * @param string $id
     * @return array
     */
    private function filterMediaEntities($images, $id)
    {
        return array_filter(
            $images,
            fn ($key) => ($key === $id || strpos($key . '-srcset', $id) === 0),
            ARRAY_FILTER_USE_KEY
        );
    }
}
