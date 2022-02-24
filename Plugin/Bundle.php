<?php

namespace Swissup\Breeze\Plugin;

class Bundle
{
    /**
     * @var \Magento\Framework\View\DesignInterfaceFactory
     */
    private $designFactory;

    /**
     * @var \Magento\Framework\View\Asset\RepositoryFactory
     */
    private $assetRepoFactory;

    /**
     * @var \Magento\Framework\Locale\ResolverInterfaceFactory
     */
    private $localeFactory;

    /**
     * @var \Swissup\Breeze\Model\ThemeResolver
     */
    private $themeResolver;

    public function __construct(
        \Magento\Framework\View\DesignInterfaceFactory $designFactory,
        \Magento\Framework\View\Asset\RepositoryFactory $assetRepoFactory,
        \Magento\Framework\View\LayoutFactory $layoutFactory,
        \Magento\Framework\Locale\ResolverInterfaceFactory $localeFactory,
        \Magento\Theme\Model\ResourceModel\Theme\CollectionFactory $themeCollectionFactory,
        \Swissup\Breeze\Model\ThemeResolver $themeResolver
    ) {
        $this->designFactory = $designFactory;
        $this->assetRepoFactory = $assetRepoFactory;
        $this->layoutFactory = $layoutFactory;
        $this->localeFactory = $localeFactory;
        $this->themeCollectionFactory = $themeCollectionFactory;
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
        $themeCollection = $this->themeCollectionFactory->create();
        $theme = $themeCollection->getThemeByFullPath($areaCode . '/' . $themePath);

        if (!$theme->getId()) {
            return $result;
        }

        $design = $this->designFactory->create()->setDesignTheme($theme, $areaCode);
        $locale = $this->localeFactory->create();
        $locale->setLocale($localeCode);
        $design->setLocale($locale);
        $assetRepo = $this->assetRepoFactory->create(['design' => $design]);

        $this->themeResolver->set($theme);
        $layout = $this->layoutFactory->create([
            'cacheable' => false,
            'themeResolver' => $this->themeResolver,
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

        return $result;
    }
}
