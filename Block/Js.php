<?php

namespace Swissup\Breeze\Block;

class Js extends \Magento\Framework\View\Element\AbstractBlock
{
    const TEMPLATE = '<script data-breeze defer src="%s"></script>';

    /**
     * @var \Magento\Framework\View\Asset\ConfigInterface
     */
    protected $assetConfig;

    /**
     * @var \Magento\Framework\View\Page\Config
     */
    protected $pageConfig;

    /**
     * @var \Swissup\Breeze\Model\JsBuildFactory
     */
    protected $jsBuildFactory;

    /**
     * @var array
     */
    protected $bundles = [];

    /**
     * @param \Magento\Backend\Block\Context $context
     * @param \Magento\Framework\View\Asset\ConfigInterface $assetConfig
     * @param \Magento\Framework\View\Page\Config $pageConfig
     * @param \Swissup\Breeze\Model\JsBuildFactory $jsBuildFactory
     * @param array $data
     */
    public function __construct(
        \Magento\Backend\Block\Context $context,
        \Magento\Framework\View\Asset\ConfigInterface $assetConfig,
        \Magento\Framework\View\Page\Config $pageConfig,
        \Swissup\Breeze\Model\JsBuildFactory $jsBuildFactory,
        array $data = []
    ) {
        $this->assetConfig = $assetConfig;
        $this->pageConfig = $pageConfig;
        $this->jsBuildFactory = $jsBuildFactory;
        $this->bundles = $data['bundles'] ?? [];

        parent::__construct($context, $data);
    }

    protected function _prepareLayout()
    {
        $properties = [
            'attributes' => 'data-breeze defer',
        ];

        foreach ($this->getData('assets') as $asset) {
            if (!is_array($asset)) {
                $asset = [
                    'url' => $asset,
                ];
            } elseif (isset($asset['enabled']) && !$asset['enabled']) {
                continue;
            }

            if (strpos($asset['url'], '::') !== false) {
                $this->pageConfig->addPageAsset($asset['url'], $properties);
            } else {
                $this->pageConfig->addRemotePageAsset(
                    $asset['url'],
                    $asset['type'] ?? 'js',
                    $properties
                );
            }
        }
    }

    /**
     * @return string
     */
    protected function _toHtml()
    {
        $scripts = [];
        $merge = $this->assetConfig->isMergeJsFiles() || $this->assetConfig->isBundlingJsFiles();

        foreach ($this->getActiveBundles() as $name => $bundle) {
            if (!$merge) {
                foreach ($bundle['components'] as $component) {
                    $path = is_array($component) ? $component['path'] : $component;
                    $jsBuild = $this->jsBuildFactory->create([
                        'name' => $path,
                        'components' => []
                    ]);
                    $scripts[] = sprintf(self::TEMPLATE, $jsBuild->getAsset()->getUrl());
                }
            } else {
                $jsBuild = $this->jsBuildFactory->create([
                    'name' => 'Swissup_Breeze/bundles/' . $name,
                    'components' => $bundle['components']
                ]);
                $jsBuild->publishIfNotExist();
                $scripts[] = sprintf(self::TEMPLATE, $jsBuild->getAsset()->getUrl());
            }
        }

        return implode("\n", $scripts);
    }

    /**
     * @param string $name
     */
    public function addItem($name)
    {
        foreach ($this->bundles as $bundleName => $bundle) {
            if (isset($bundle['components'][$name])) {
                $this->bundles[$bundleName]['active'] = true;
            }
        }
    }

    /**
     * @return string[]
     */
    public function getCacheKeyInfo()
    {
        $info = [$this->getNameInLayout()];

        foreach ($this->getActiveBundles() as $bundleName => $bundle) {
            $info[] = $bundleName;
            $info = array_merge($info, array_keys($bundle['components']));
        }

        sort($info);

        return $info;
    }

    /**
     * @return array
     */
    protected function getActiveBundles()
    {
        $bundles = array_filter($this->bundles, function ($bundle) {
            return $bundle['active'] ?? false;
        });

        uasort($bundles, function ($a, $b) {
            $a = $a['sort_order'] ?? 1000;
            $b = $b['sort_order'] ?? 1000;

            if ($a === $b) {
                return 0;
            }

            return $a < $b ? -1 : 1;
        });

        return $bundles;
    }
}
