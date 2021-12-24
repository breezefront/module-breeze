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
    private $sizesConfig;

    private $sizesMemo;

    private $srcsetParamsMemo;

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
        if (!$this->helper->isResponsiveImagesEnabled()) {
            return '';
        }

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
        if (isset($this->sizesMemo[$id])) {
            return $this->sizesMemo[$id];
        }

        if (!$this->sizesConfig) {
            $this->sizesConfig = array_merge(
                $this->helper->getConfig('design/breeze/sizes'),
                $this->helper->getThemeConfig('sizes') ?: []
            );
        }

        $keys = [
            $id . '-' . $this->getCurrentPageLayout(),
            $id,
        ];

        foreach ($keys as $key) {
            if (!isset($this->sizesConfig[$key])) {
                continue;
            }

            $result = $this->sizesConfig[$key];

            if (strpos($result, 'use:') === 0) {
                return $this->getSizes(substr($result, 4));
            }

            $this->sizesMemo[$id] = $result;

            return $result;
        }

        // fallback for images without defines sizes (compare page, etc.)
        $params = $this->helper->getViewConfig()->getMediaAttributes('Magento_Catalog', 'images', $id);
        $params = isset($params['width']) ? $params['width'] . 'px' : '';
        $this->sizesMemo[$id] = $params;

        return $params;
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
        if (isset($this->srcsetParamsMemo[$id])) {
            return $this->srcsetParamsMemo[$id];
        }

        $images = $this->helper->getViewConfig()->getMediaEntities('Magento_Catalog', 'images');
        $params = $this->filterMediaEntities($images, $id);

        if (!$params || count($params) > 1) {
            $this->srcsetParamsMemo[$id] = $params;
            return $params;
        }

        $params = array_values($params);
        $fallbacks = [
            'category_page_grid',
            'category_page_list',
            'product_small_image', // compare list
            'product_page_image_small', // thumbnails at product page
        ];

        foreach ($fallbacks as $fallbackId) {
            $fallbackParams = $images[$fallbackId] ?? false;

            if (!$fallbackParams || !isset($params[0]['width']) || !isset($params[0]['height'])) {
                continue;
            }

            if ($params[0]['width'] === $fallbackParams['width'] &&
                $params[0]['height'] === $fallbackParams['height']
            ) {
                $params = $this->filterMediaEntities($images, $fallbackId);
                break;
            }
        }

        $this->srcsetParamsMemo[$id] = $params;

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
            function ($key) use ($id) {
                return $key === $id || strpos($key . '-srcset', $id) === 0;
            },
            ARRAY_FILTER_USE_KEY
        );
    }
}
