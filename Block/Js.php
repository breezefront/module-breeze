<?php

namespace Swissup\Breeze\Block;

class Js extends \Magento\Framework\View\Element\AbstractBlock
{
    const TEMPLATE_DYNAMIC = '<script type="breeze/dynamic-js">%s</script>';
    const TEMPLATE = '<script defer src="%s"></script>';

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

    protected $itemInfoMap = [];

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
        $allAssets = [];

        if ($this->isBundlingEnabled()) {
            list($assets, $allAssets) = $this->deployBundledAssets();
        } else {
            $assets = $this->deployAssets();
        }

        $scripts = [];
        foreach ($assets as $asset) {
            $scripts[$asset->getUrl()] = sprintf(self::TEMPLATE, $asset->getUrl());
        }

        return implode("\n", $scripts)
            . "\n"
            . sprintf(
                self::TEMPLATE_DYNAMIC,
                json_encode($this->generateBreezemap($allAssets), JSON_UNESCAPED_SLASHES)
            );
    }

    private function isBundlingEnabled()
    {
        return $this->assetConfig->isMergeJsFiles() || $this->assetConfig->isBundlingJsFiles();
    }

    private function generateBreezemap($bundledAssets)
    {
        $result = [
            'map' => [],
            'rules'=> [],
        ];

        $bundleIndexes = array_fill_keys(array_keys($this->getAllBundles()), 0);
        foreach ($bundledAssets as $asset) {
            $pathParts = explode('/', $asset->getUrl());
            $filename = array_pop($pathParts);
            preg_match("/(?<bundle>.*)(?<index>\d+)(\.min)?\.js$/", $filename, $matches);

            if (!$matches || !isset($bundleIndexes[$matches['bundle']])) {
                continue;
            }

            $bundleIndexes[$matches['bundle']] = $matches['index'];
        }

        $activeBundles = array_keys($this->getActiveBundles());
        foreach ($this->getAllBundles() as $name => $bundle) {
            foreach ($bundle['items'] as $alias => $item) {
                $item['path'] = str_replace('::', '/', $item['path']);
                $item['load'] = array_filter($item['load'] ?? []);

                if (!empty($item['load']) || !in_array($name, $activeBundles)) {
                    $path = $item['path'];
                    if (empty($item['load']) && $this->isBundlingEnabled()) {
                        $path = "{$name}*{$bundleIndexes[$name]}";
                    }

                    $result['map'][$alias] = $path;
                    $names = $item['names'] ?? []; // deprecated, use export instead
                    $names += $item['export'] ?? [];
                    foreach ($names as $anotherName) {
                        $result['map'][$anotherName] = $path;
                    }

                    $result['rules'][$path] = array_filter([
                        'import' => array_filter(array_map(
                            fn ($name) => str_replace('::', '/', $name),
                            array_values($item['import'] ?? [])
                        ), function ($name) use ($alias) {
                            if ($name === $alias) {
                                return true;
                            }

                            $info = $this->findItemInfo($name);

                            return !$info || !empty($info['item']['load']);
                        })
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
                $paths = [];
                foreach (['deps', 'import', 'path'] as $key) {
                    $pathsToAdd = $item[$key] ?? [];
                    if (!is_array($pathsToAdd)) {
                        $pathsToAdd = [$pathsToAdd];
                    }
                    $paths = array_merge($paths, array_values($pathsToAdd));
                }

                foreach ($paths as $key => $path) {
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
        $allAssets = [];
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

            $allAssets = array_merge($allAssets, $builds[$name]->getBundledAssets());
            $dynamicItems = array_filter($bundle['items'], fn ($item) => !empty(array_filter($item['load'] ?? [])));
            foreach ($dynamicItems as $item) {
                $this->jsBuildFactory->create(['name' => $item['path']])->getAsset();
            }
        }

        $assets = [];
        foreach ($this->getActiveBundles() as $name => $bundle) {
            $assets = array_merge($assets, $builds[$name]->getBundledAssets());
        }

        return [$assets, $allAssets];
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
                if (!$item) {
                    unset($this->allBundles[$bundleName]['items'][$itemName]);
                    continue;
                }

                if (!is_array($item)) {
                    $item = ['path' => $item];
                    $this->allBundles[$bundleName]['items'][$itemName] = $item;
                }

                if (empty($item['load']) && $bundleName === 'dynamic') {
                    $item['load'] = ['onRequire' => true];
                    $this->allBundles[$bundleName]['items'][$itemName] = $item;
                }
            }
        }

        foreach ($this->allBundles as $bundleName => $bundle) {
            foreach ($bundle['items'] as $itemName => $item) {
                // add import/load to mixins
                foreach ($item['mixins'] ?? [] as $mixinItemName) {
                    if (!$info = $this->findItemInfo($mixinItemName)) {
                        continue;
                    }

                    $this->allBundles[$info['bundle']]['items'][$info['itemName']]['import'][] = $itemName;

                    if (isset($this->allBundles[$info['bundle']]['items'][$info['itemName']]['load'])) {
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
        foreach ($bundles as $bundleName => $bundle) {
            foreach ($bundle['items'] as $itemName => $item) {
                if (empty($item['import'])) {
                    continue;
                }

                foreach ($item['import'] as $key => $value) {
                    $info = $this->findItemInfo($value);
                    if (!$info) {
                        continue;
                    }

                    $importBundle = $info['bundle'];
                    if (empty($this->activeBundles[$importBundle])) {
                        unset($this->allBundles[$bundleName]['items'][$itemName]['import'][$key]);
                        $this->activeBundles[$importBundle] = $this->allBundles[$importBundle];
                        $this->processImports([$importBundle => $this->allBundles[$importBundle]]);
                    }
                }
            }
        }
    }

    /**
     * @param string $itemName
     * @return array
     */
    private function findItemInfo($itemName)
    {
        if (isset($this->itemInfoMap[$itemName])) {
            return $this->itemInfoMap[$itemName];
        }

        $this->itemInfoMap[$itemName] = false;

        foreach ($this->allBundles as $name => $bundle) {
            if (isset($bundle['items'][$itemName])) {
                $this->itemInfoMap[$itemName] = [
                    'bundle' => $name,
                    'itemName' => $itemName,
                    'item' => $bundle['items'][$itemName],
                ];
                break;
            }

            foreach ($bundle['items'] as $key => $item) {
                $names = array_flip($item['names'] ?? []); // deprecated, use export instead
                $names += array_flip($item['export'] ?? []);
                if (isset($names[$itemName])) {
                    $this->itemInfoMap[$itemName] = [
                        'bundle' => $name,
                        'itemName' => $key,
                        'item' => $item,
                    ];
                    break 2;
                }
            }
        }

        return $this->itemInfoMap[$itemName];
    }
}
