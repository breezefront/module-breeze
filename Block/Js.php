<?php

namespace Swissup\Breeze\Block;

class Js extends \Magento\Framework\View\Element\AbstractBlock
{
    const TEMPLATE = '<script data-breeze defer src="%s"></script>';

    /**
     * @var \Magento\Framework\App\State
     */
    protected $appState;

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
     * @var array
     */
    protected $activeItems = [];

    /**
     * @var array
     */
    protected $activeBundles = null;

    /**
     * @param \Magento\Backend\Block\Context $context
     * @param \Magento\Framework\App\State $appState
     * @param \Magento\Framework\View\Asset\ConfigInterface $assetConfig
     * @param \Magento\Framework\View\Page\Config $pageConfig
     * @param \Swissup\Breeze\Model\JsBuildFactory $jsBuildFactory
     * @param array $data
     */
    public function __construct(
        \Magento\Backend\Block\Context $context,
        \Magento\Framework\App\State $appState,
        \Magento\Framework\View\Asset\ConfigInterface $assetConfig,
        \Magento\Framework\View\Page\Config $pageConfig,
        \Swissup\Breeze\Model\JsBuildFactory $jsBuildFactory,
        array $data = []
    ) {
        $this->appState = $appState;
        $this->assetConfig = $assetConfig;
        $this->pageConfig = $pageConfig;
        $this->jsBuildFactory = $jsBuildFactory;

        $bundles = $data['bundles'] ?? [];
        foreach ($bundles as $key => $bundle) {
            if (empty($bundle['items'])) {
                unset($bundles[$key]);
            }
        }
        $this->bundles = $bundles;

        parent::__construct($context, $data);
    }

    protected function _prepareLayout()
    {
        if (!$this->getData('assets')) {
            return;
        }

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
        $merge = $this->appState->getMode() === \Magento\Framework\App\State::MODE_PRODUCTION
            || $this->assetConfig->isMergeJsFiles()
            || $this->assetConfig->isBundlingJsFiles();

        foreach ($this->getActiveBundles() as $name => $bundle) {
            if (!$merge) {
                foreach ($bundle['items'] as $item) {
                    $path = $item;
                    $paths = [];

                    if (is_array($item)) {
                        $path = $item['path'];
                        $paths = $item['deps'] ?? [];
                        $paths += $item['import'] ?? [];
                    }

                    $paths[] = $path;
                    foreach ($paths as $key => $path) {
                        if (strpos($key, '::') !== false) {
                            continue;
                        }

                        $url = $this->jsBuildFactory->create(['name' => $path])
                            ->getAsset()
                            ->getUrl();

                        $scripts[$url] = sprintf(self::TEMPLATE, $url);
                    }
                }
            } else {
                $assets = $this->jsBuildFactory->create([
                        'name' => 'Swissup_Breeze/bundles/' . $name,
                        'items' => $bundle['items']
                    ])
                    ->publishIfNotExist($this->getCacheKey())
                    ->getBundledAssets();

                foreach ($assets as $asset) {
                    $scripts[$asset->getUrl()] = sprintf(self::TEMPLATE, $asset->getUrl());
                }
            }
        }

        return implode("\n", $scripts);
    }

    /**
     * @param string $name
     */
    public function addItem($name)
    {
        $this->activeItems[$name] = $name;
    }

    /**
     * @return string[]
     */
    public function getCacheKeyInfo()
    {
        $info = [
            $this->getNameInLayout(),
            $this->_design->getDesignTheme()->getId(),
        ];

        foreach ($this->getActiveBundles() as $bundleName => $bundle) {
            $info[] = $bundleName;
            $info = array_merge($info, array_keys($bundle['items']));
        }

        sort($info);

        return $info;
    }

    /**
     * @return array
     */
    protected function getActiveBundles()
    {
        if ($this->activeBundles !== null) {
            return $this->activeBundles;
        }

        $this->activeBundles = [];

        foreach ($this->bundles as $bundleName => $bundle) {
            if (!empty($bundle['active'])) {
                $this->activeBundles[$bundleName] = $bundle;
                continue;
            }

            $registeredNames = array_keys($bundle['items']);
            foreach ($bundle['items'] as $item) {
                if (!is_array($item) || empty($item['names'])) {
                    continue;
                }
                $registeredNames += $item['names'];
            }

            if (array_intersect($registeredNames, $this->activeItems)) {
                $this->activeBundles[$bundleName] = $bundle;
            }
        }

        // unset disabled components
        foreach ($this->activeBundles as $bundleName => $bundle) {
            foreach ($bundle['items'] as $itemName => $item) {
                if (!is_array($item)) {
                    continue;
                }

                $names = $item['names'] ?? [];
                if ($names && array_intersect($names, $this->activeItems)) {
                    continue; // do not check enabled state for the items from dom structure
                }

                $item['enabled'] = $item['enabled'] ?? true;

                if (!$item['enabled']) {
                    unset($this->activeBundles[$bundleName]['items'][$itemName]);
                }
            }
        }

        $this->processImports($this->activeBundles);

        uasort($this->activeBundles, function ($a, $b) {
            $a = $a['sort_order'] ?? 1000;
            $b = $b['sort_order'] ?? 1000;

            if ($a === $b) {
                return 0;
            }

            return $a < $b ? -1 : 1;
        });

        return $this->activeBundles;
    }

    /**
     * @param array $bundles
     * @return void
     */
    private function processImports($bundles)
    {
        foreach ($bundles as $bundle) {
            foreach ($bundle['items'] as $item) {
                if (!is_array($item) || empty($item['import'])) {
                    continue;
                }

                foreach ($item['import'] as $key => $value) {
                    if (strpos($key, '::') === false) {
                        continue; // file dependency will be processed later
                    }

                    if (strpos($key, 'item::') === 0) {
                        $bundleName = $this->findBundleName($value);
                    } else {
                        $bundleName = $value;
                    }

                    if ($bundleName &&
                        empty($this->activeBundles[$bundleName]) &&
                        !empty($this->bundles[$bundleName])
                    ) {
                        $this->activeBundles[$bundleName] = $this->bundles[$bundleName];
                        $this->processImports([$bundleName => $this->bundles[$bundleName]]);
                    }
                }
            }
        }
    }

    /**
     * @param string $itemName
     * @return string|false
     */
    private function findBundleName($itemName)
    {
        foreach ($this->bundles as $name => $bundle) {
            if (isset($bundle['items'][$itemName])) {
                return $name;
            }
        }

        return false;
    }
}
