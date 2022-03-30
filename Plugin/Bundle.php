<?php

namespace Swissup\Breeze\Plugin;

use Magento\Framework\App\Area;

class Bundle
{
    /**
     * @var \Magento\Framework\App\State
     */
    private $appState;

    /**
     * @var \Magento\Framework\View\DesignInterfaceFactory
     */
    private $designFactory;

    /**
     * @var \Magento\Framework\View\Asset\RepositoryFactory
     */
    private $assetRepoFactory;

    /**
     * @var \Magento\Framework\View\LayoutFactory
     */
    private $layoutFactory;

    /**
     * @var \Magento\Framework\Locale\ResolverInterfaceFactory
     */
    private $localeFactory;

    /**
     * @var \Magento\Framework\View\Design\Theme\ThemeProviderInterface
     */
    private $themeProvider;

    /**
     * @var \Swissup\Breeze\Model\LayoutProcessorFactory
     */
    private $layoutProcessorFactory;

    /**
     * @var \Swissup\Breeze\Model\ThemeResolver
     */
    private $themeResolver;

    public function __construct(
        \Magento\Framework\App\State $appState,
        \Magento\Framework\View\DesignInterfaceFactory $designFactory,
        \Magento\Framework\View\Asset\RepositoryFactory $assetRepoFactory,
        \Magento\Framework\View\LayoutFactory $layoutFactory,
        \Magento\Framework\Locale\ResolverInterfaceFactory $localeFactory,
        \Magento\Framework\View\Design\Theme\ThemeProviderInterface $themeProvider,
        \Magento\Framework\View\Layout\ProcessorFactory $layoutProcessorFactory,
        \Swissup\Breeze\Model\ThemeResolver $themeResolver
    ) {
        $this->appState = $appState;
        $this->designFactory = $designFactory;
        $this->assetRepoFactory = $assetRepoFactory;
        $this->layoutFactory = $layoutFactory;
        $this->localeFactory = $localeFactory;
        $this->themeProvider = $themeProvider;
        $this->layoutProcessorFactory = $layoutProcessorFactory;
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

        $this->appState->emulateAreaCode(Area::AREA_FRONTEND, function () use ($assetRepo) {
            $layout = $this->layoutFactory->create([
                'cacheable' => false,
                'themeResolver' => $this->themeResolver,
                'processorFactory' => $this->layoutProcessorFactory,
            ]);
            $layout->getUpdate()->addHandle('breeze_default')->load();
            $layout->generateXml();
            $layout->generateElements();

            $block = $layout->getBlock('breeze.js');
            if ($block) {
                $block->deployBundledAssets([
                    'assetRepo' => $assetRepo,
                ]);
            }
        });

        return $result;
    }
}
