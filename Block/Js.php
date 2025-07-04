<?php

namespace Swissup\Breeze\Block;

class Js extends \Magento\Framework\View\Element\AbstractBlock
{
    const TEMPLATE_DYNAMIC = '<script type="breeze/dynamic-js">%s</script>';
    const TEMPLATE_MODULE = '<script type="module" src="%s"></script>';
    const TEMPLATE_ASYNC = '<script type="breeze/async-js" src="%s"></script>';
    const TEMPLATE = '<script defer src="%s"></script>';

    protected $templateTypes = [
        'defer' => self::TEMPLATE,
        'async' => self::TEMPLATE_ASYNC,
        'module' => self::TEMPLATE_MODULE,
    ];

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
    protected $ignore = [];

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
        $this->ignore = $data['ignore'] ?? [];

        parent::__construct($context, $data);
    }

    protected function _prepareLayout()
    {
        if (!$this->getData('assets')) {
            return $this;
        }

        $properties = [
            'attributes' => 'defer',
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
            $scripts[$asset->getUrl()] = sprintf(
                $this->templateTypes[$asset->getType()] ?? self::TEMPLATE,
                $asset->getUrl()
            );
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

        $result = [];
        foreach ($this->getAllBundles() as $bundleName => $bundle) {
            foreach ($bundle['items'] as $alias => $item) {
                $item['path'] = str_replace('::', '/', $item['path']);
                $item['load'] = array_filter($item['load'] ?? []);

                $path = $item['path'];
                if (empty($item['load']) && $this->isBundlingEnabled()) {
                    $path = "{$bundleName}*{$bundleIndexes[$bundleName]}";
                }

                $result[$bundleName][$alias] = [
                    'path' => $path,
                    'import' => array_values(array_filter(array_map(
                        fn ($name) => str_replace('::', '/', $name),
                        array_values($item['import'] ?? [])
                    ), function ($name) use ($alias, $path) {
                        $isBundle = strpos($path, '*') !== false && strpos($alias, '*') === false;

                        // Importing the same name means that we trying to load original "luma" file.
                        // if bundling is enabled we do not need to import it since it will be in the same bundle.
                        if ($name === $alias) {
                            return !$isBundle;
                        }

                        $info = $this->findItemInfo($name);

                        // If bundling is enabled and "import" is not a component but simple path,
                        // our merge will put this import inside this bundle.
                        if ($isBundle && !$info) {
                            return false;
                        }

                        return true;
                    })),
                ];

                if (!empty($item['load'])) {
                    $result[$bundleName][$alias]['load'] = array_filter([
                        'onInteraction' => !empty($item['load']['onInteraction']),
                        'onEvent' => array_values($item['load']['onEvent'] ?? []),
                        'onReveal' => array_values($item['load']['onReveal'] ?? []),
                        'onDom' => array_values($item['load']['onDom'] ?? []),
                    ]);
                } elseif (!$this->isBundlingEnabled() && !empty($item['autoload'])) {
                    $result[$bundleName][$alias]['autoload'] = true;
                }

                if (!empty($item['global'])) {
                    $result[$bundleName][$alias]['global'] = $item['global'];
                }

                if (isset($result[$bundleName][$alias])) {
                    $result[$bundleName][$alias] = array_filter($result[$bundleName][$alias]);
                    $names = $item['names'] ?? []; // deprecated, use export instead
                    $names += $item['export'] ?? [];
                    foreach ($names as $anotherName) {
                        if ($anotherName === $alias) {
                            continue;
                        }
                        $result[$bundleName][$anotherName]['ref'] = $alias;
                    }
                }
            }
        }

        return [
            'bundles' => $result,
            'ignore' => array_values($this->ignore),
        ];
    }

    public function deployAssets(): array
    {
        $assets = [];

        foreach ($this->getActiveBundles() as $name => $bundle) {
            foreach ($bundle['items'] as $item) {
                $paths = [];
                foreach (['deps', 'import'] as $key) {
                    foreach ($item[$key] ?? [] as $path) {
                        $info = $this->findItemInfo($path);
                        $paths[] = $info ? $info['item']['path'] : $path;
                    }
                }
                $paths[] = $item['path'];

                foreach ($paths as $key => $path) {
                    $asset = $this->jsBuildFactory->create([
                        'name' => $path,
                        'type' => $bundle['type'],
                    ])->getAsset();
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
                'type' => $bundle['type'],
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
                $this->jsBuildFactory->create([
                    'name' => $item['path'],
                    'type' => $bundle['type'],
                ])->getAsset();
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
            }
        }

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
            $this->allBundles[$bundleName]['type'] ??= 'async';

            foreach ($bundle['items'] as $itemName => $item) {
                if (strpos($itemName, '*') !== false && $bundleName !== 'dynamic') {
                    throw new \Exception(sprintf(
                        'Mass registration is allowed in dynamic bundles only. Please move "%s" to dynamic bundle.',
                        $itemName
                    ));
                }

                if (!$item) {
                    unset($this->allBundles[$bundleName]['items'][$itemName]);
                    continue;
                }

                if (!is_array($item)) {
                    $item = ['path' => $item];
                    $this->allBundles[$bundleName]['items'][$itemName] = $item;
                }

                $item['enabled'] ??= true;

                if (!$item['enabled']) {
                    unset($this->allBundles[$bundleName]['items'][$itemName]);
                } elseif (empty($item['load']) && $bundleName === 'dynamic' || strpos($item['path'], '//') !== false) {
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

                    if (!isset($this->allBundles[$info['bundle']]['items'][$info['itemName']]['import'])) {
                        $this->allBundles[$info['bundle']]['items'][$info['itemName']]['import'] = [];
                    }

                    array_unshift(
                        $this->allBundles[$info['bundle']]['items'][$info['itemName']]['import'],
                        $itemName
                    );

                    if (isset($this->allBundles[$info['bundle']]['items'][$info['itemName']]['load'])) {
                        $this->allBundles[$bundleName]['items'][$itemName]['load']['onRequire'] = true;
                    }

                    $this->clearFindItemInfoMemo($mixinItemName);
                }
            }
        }

        foreach ($this->allBundles as $bundleName => $bundle) {
            $index = -1;
            $imported = [];
            foreach ($bundle['items'] as $itemName => $item) {
                $imported[$itemName] = $itemName;
                $imported[$item['path']] = $item['path'];
                $index++;

                if (!empty($item['load']) || empty($item['import'])) {
                    continue;
                }

                foreach ($item['import'] as $importItemName) {
                    if (isset($imported[$importItemName])) {
                        continue;
                    }

                    if (!$info = $this->findItemInfo($importItemName)) {
                        continue;
                    }

                    if ($info['bundle'] !== $bundleName || !empty($info['item']['load'])) {
                        continue;
                    }

                    $start = array_slice($this->allBundles[$bundleName]['items'], 0, $index);
                    $end = array_slice($this->allBundles[$bundleName]['items'], $index);
                    $start[$info['itemName']] = $info['item'];
                    $this->allBundles[$bundleName]['items'] = $start + $end;
                }

                $bundle['items'] = $this->allBundles[$bundleName]['items'];
            }
        }

        return $this->allBundles;
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

    private function clearFindItemInfoMemo($itemName)
    {
        unset($this->itemInfoMap[$itemName]);
    }
}
