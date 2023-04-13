<?php

namespace Swissup\Breeze\Plugin;

use Magento\Framework\App\Area;

class Bundle
{
    private \Magento\Framework\App\State $appState;

    private \Magento\Framework\Event\ManagerInterface $eventManager;

    private \Magento\Framework\View\DesignInterfaceFactory $designFactory;

    private \Magento\Framework\View\Asset\RepositoryFactory $assetRepoFactory;

    private \Magento\Framework\View\LayoutFactory $layoutFactory;

    private \Magento\Framework\Locale\ResolverInterfaceFactory $localeFactory;

    private \Magento\Framework\View\Design\Theme\ThemeProviderInterface $themeProvider;

    private \Magento\Store\Model\StoreManagerInterface $storeManager;

    private \Swissup\Breeze\Model\ThemeResolver $themeResolver;

    public function __construct(
        \Magento\Framework\App\State $appState,
        \Magento\Framework\Event\ManagerInterface $eventManager,
        \Magento\Framework\View\DesignInterfaceFactory $designFactory,
        \Magento\Framework\View\Asset\RepositoryFactory $assetRepoFactory,
        \Magento\Framework\View\LayoutFactory $layoutFactory,
        \Magento\Framework\Locale\ResolverInterfaceFactory $localeFactory,
        \Magento\Framework\View\Design\Theme\ThemeProviderInterface $themeProvider,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Swissup\Breeze\Model\ThemeResolver $themeResolver
    ) {
        $this->appState = $appState;
        $this->eventManager = $eventManager;
        $this->designFactory = $designFactory;
        $this->assetRepoFactory = $assetRepoFactory;
        $this->layoutFactory = $layoutFactory;
        $this->localeFactory = $localeFactory;
        $this->themeProvider = $themeProvider;
        $this->storeManager = $storeManager;
        $this->themeResolver = $themeResolver;
    }

    /**
     * @param \Magento\Deploy\Service\Bundle $subject
     * @param void $result
     * @param string $areaCode
     * @param string $themePath
     * @param string $localeCode
     * @return void
     */
    public function afterDeploy(
        \Magento\Deploy\Service\Bundle $subject,
        $result,
        $areaCode,
        $themePath,
        $localeCode
    ) {
        if ($areaCode !== Area::AREA_FRONTEND) {
            return $result;
        }

        $theme = $this->themeProvider->getThemeByFullPath($areaCode . '/' . $themePath);

        if (!$theme->getId()) {
            // Prevent cache collisions when deploying without DB connection
            // @see Magento\Framework\View\Model\Layout\Merge::generateCacheId
            $theme->setId($themePath);
        }

        $design = $this->designFactory->create()->setDesignTheme($theme, $areaCode);
        $locale = $this->localeFactory->create();
        $locale->setLocale($localeCode);
        $design->setLocale($locale);
        $assetRepo = $this->assetRepoFactory->create(['design' => $design]);

        $this->themeResolver->set($theme);

        $handles = $this->getHandles();
        $oldStoreId = $this->storeManager->getStore()->getId();
        foreach ($this->storeManager->getStores() as $store) {
            $this->storeManager->setCurrentStore($store->getId());
            $this->appState->emulateAreaCode(Area::AREA_FRONTEND, function ($handles, $assetRepo) {
                $layout = $this->layoutFactory->create([
                    'cacheable' => false,
                    'themeResolver' => $this->themeResolver,
                ]);
                $layout->getUpdate()->addHandle($handles)->load();
                $layout->generateXml();
                $layout->generateElements();

                $block = $layout->getBlock('breeze.js');
                if ($block) {
                    $block->deployBundledAssets([
                        'assetRepo' => $assetRepo,
                    ]);
                }
            }, [$handles, $assetRepo]);
        }

        $this->storeManager->setCurrentStore($oldStoreId);

        return $result;
    }

    private function getHandles()
    {
        $transport = new \Magento\Framework\DataObject([
            'handles' => [
                'default',
                'default_head_blocks',
                'breeze_default',
            ],
        ]);

        $this->eventManager->dispatch(
            'swissup_breeze_bundle_collect_handles',
            [
                'transport' => $transport
            ]
        );

        return $transport->getHandles();
    }
}
