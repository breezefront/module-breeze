<?php

namespace Swissup\Breeze\Block;

class Js extends \Magento\Framework\View\Element\AbstractBlock
{
    const TEMPLATE_DYNAMIC = '<script type="breeze/dynamic-js">%s</script>';
    const TEMPLATE = '<script data-breeze defer src="%s"></script>';

    /**
     * @var \Magento\Framework\App\View\Deployment\Version
     */
    protected $deploymentVersion;

    /**
     * @var \Magento\Framework\View\Asset\ConfigInterface
     */
    protected $assetConfig;

    /**
     * @var \Magento\Framework\View\Page\Config
     */
    protected $pageConfig;

    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    protected $storeManager;

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
     * @var array
     */
    protected $allBundles = null;

    protected $redeploy = false;

    /**
     * @param \Magento\Backend\Block\Context $context
     * @param \Magento\Framework\View\Asset\ConfigInterface $assetConfig
     * @param \Magento\Framework\View\Page\Config $pageConfig
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Swissup\Breeze\Model\JsBuildFactory $jsBuildFactory
     * @param array $data
     */
    public function __construct(
        \Magento\Backend\Block\Context $context,
        \Magento\Framework\App\View\Deployment\Version $deploymentVersion,
        \Magento\Framework\View\Asset\ConfigInterface $assetConfig,
        \Magento\Framework\View\Page\Config $pageConfig,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Swissup\Breeze\Model\JsBuildFactory $jsBuildFactory,
        array $data = []
    ) {
        $this->deploymentVersion = $deploymentVersion;
        $this->assetConfig = $assetConfig;
        $this->pageConfig = $pageConfig;
        $this->storeManager = $storeManager;
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
            return $this;
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

        return $this;
    }

    /**
     * @return string
     */
    protected function _toHtml()
    {
        $assets = [];

        if ($this->assetConfig->isMergeJsFiles() || $this->assetConfig->isBundlingJsFiles()) {
            $assets = $this->deployBundledAssets();
        } else {
            $assets = $this->deployAssets();
        }

        $scripts = [];
        foreach ($assets as $asset) {
            $scripts[$asset->getUrl()] = sprintf(self::TEMPLATE, $asset->getUrl());
        }

        return implode("\n", $scripts)
            . "\n"
            . sprintf(self::TEMPLATE_DYNAMIC, json_encode($this->generateBreezemap()));
    }

    private function generateBreezemap()
    {
        $result = [
            'map' => [],
            'rules'=> [],
        ];
        $activeBundles = array_keys($this->getActiveBundles());

        foreach ($this->getAllBundles() as $name => $bundle) {
            foreach ($bundle['items'] as $alias => $item) {
                $item['path'] = str_replace('::', '/', $item['path']);
                $item['load'] = array_filter($item['load'] ?? []);

                if (!empty($item['load']) || !in_array($name, $activeBundles)) {
                    $result['map'][$alias] = $item['path'];
                    foreach ($item['names'] ?? [] as $anotherName) {
                        $result['map'][$anotherName] = $item['path'];
                    }

                    $result['rules'][$item['path']] = array_filter([
                        'import' => array_map(
                            fn ($string) => str_replace('::', '/', $string),
                            array_values($item['import'] ?? [])
                        ),
                    ]);
                }

                if (!empty($item['load'])) {
                    $result['rules'][$item['path']] += array_filter([
                        'load' => array_filter([
                            'onInteraction' => !empty($item['load']['onInteraction']),
                            'onEvent' => array_values($item['load']['onEvent'] ?? []),
                            'onReveal' => array_values($item['load']['onReveal'] ?? []),
                        ]),
                    ]);
                }
            }
        }

        $result['rules'] = array_filter($result['rules']);

        return $result;
    }

    public function deployAssets(): array
    {
        $assets = [];

        foreach ($this->getActiveBundles() as $name => $bundle) {
            foreach ($bundle['items'] as $item) {
                $paths = $item['deps'] ?? []; // deps are deprecated. Use import instead
                $paths += $item['import'] ?? [];
                $paths[] = $item['path'];

                foreach ($paths as $key => $path) {
                    if (strpos($key, '::') !== false) {
                        continue;
                    }

                    $asset = $this->jsBuildFactory->create(['name' => $path])->getAsset();
                    if (empty(array_filter($item['load'] ?? []))) {
                        $assets[] = $asset;
                    }
                }
            }
        }

        return $assets;
    }

    public function deployBundledAssets($jsBuildParams = []): array
    {
        $builds = [];
        foreach ($this->getAllBundles() as $name => $bundle) {
            $staticItems = array_filter($bundle['items'], fn ($item) => empty(array_filter($item['load'] ?? [])));
            $builds[$name] = $this->jsBuildFactory->create(array_merge([
                'name' => 'Swissup_Breeze/bundles/' . $this->storeManager->getStore()->getId() . '/' . $name,
                'items' => $staticItems,
            ], $jsBuildParams));

            if ($this->redeploy) {
                $builds[$name]->publish();
            } else {
                $builds[$name]->publishIfNotExist();
            }

            $dynamicItems = array_filter($bundle['items'], fn ($item) => !empty(array_filter($item['load'] ?? [])));
            foreach ($dynamicItems as $item) {
                $this->jsBuildFactory->create(['name' => $item['path']])->getAsset();
            }
        }

        $assets = [];
        foreach ($this->getActiveBundles() as $name => $bundle) {
            $assets = array_merge($assets, $builds[$name]->getBundledAssets());
        }

        return $assets;
    }

    public function setRedeploy(bool $flag)
    {
        $this->redeploy = $flag;
        return $this;
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
        try {
            $version = $this->deploymentVersion->getValue();
        } catch (\Exception $e) {
            $version = '';
        }

        $info = [
            $this->getNameInLayout(),
            $this->storeManager->getStore()->getId(),
            $this->_design->getDesignTheme()->getId(),
            $version,
        ];

        foreach ($this->getActiveBundles() as $bundleName => $bundle) {
            $info[] = $bundleName;
            $info = [...$info, ...array_keys($bundle['items'])];
        }

        sort($info);

        return $info;
    }

    /**
     * Get bundles active for the currently viewed page
     */
    protected function getActiveBundles(): array
    {
        if ($this->activeBundles !== null) {
            return $this->activeBundles;
        }

        $this->activeBundles = [];

        foreach ($this->getAllBundles() as $bundleName => $bundle) {
            if (!empty($bundle['active'])) {
                $this->activeBundles[$bundleName] = $bundle;
                continue;
            }

            $registeredNames = [];
            foreach ($bundle['items'] as $key => $item) {
                // do not activate bundle if item uses dynamic-js rules
                if (!empty(array_filter($item['load'] ?? []))) {
                    continue;
                }

                $registeredNames[] = $key;
                $registeredNames += $item['names'] ?? []; // deprecated, use export instead
                $registeredNames += $item['export'] ?? [];
            }

            if (array_intersect($registeredNames, $this->activeItems)) {
                $this->activeBundles[$bundleName] = $bundle;
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
     * Get all bundles without disabled components
     */
    protected function getAllBundles(): array
    {
        if ($this->allBundles !== null) {
            return $this->allBundles;
        }

        $this->allBundles = $this->bundles;

        foreach ($this->allBundles as $bundleName => $bundle) {
            foreach ($bundle['items'] as $itemName => $item) {
                if (!is_array($item)) {
                    $item = ['path' => $item];
                    $this->allBundles[$bundleName]['items'][$itemName] = $item;
                }

                // add import/load to mixins
                foreach ($item['mixins'] ?? [] as $mixinItemName) {
                    $mixinBundleName = $this->findBundleName($mixinItemName);
                    if (!$mixinBundleName) {
                        continue;
                    }

                    $this->allBundles[$mixinBundleName]['items'][$mixinItemName]['import'][] = $itemName;

                    if (isset($this->bundles[$mixinBundleName]['items'][$mixinItemName]['load'])) {
                        $this->allBundles[$bundleName]['items'][$itemName]['load']['onRequire'] = true;
                    }
                }

                // unset disabled bundles
                $names = $item['names'] ?? []; // deprecated, use export instead
                $names += $item['export'] ?? [];
                if ($names && array_intersect($names, $this->activeItems)) {
                    continue; // do not check enabled state for the items from dom structure
                }

                $item['enabled'] ??= true;

                if (!$item['enabled']) {
                    unset($this->allBundles[$bundleName]['items'][$itemName]);
                }
            }
        }

        return $this->allBundles;
    }

    /**
     * @param array $bundles
     * @return void
     */
    private function processImports($bundles)
    {
        foreach ($bundles as $bundle) {
            foreach ($bundle['items'] as $item) {
                if (empty($item['import'])) {
                    continue;
                }

                foreach ($item['import'] as $key => $value) {
                    $bundleName = $this->findBundleName($value);

                    if ($bundleName && empty($this->activeBundles[$bundleName])) {
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
