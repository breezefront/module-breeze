<?php

namespace Swissup\Breeze\Plugin;

class Bundle
{
    /**
     * @var \Magento\Framework\App\State
     */
    private $appState;

    /**
     * @var \Magento\Framework\View\Design\Theme\ListInterface
     */
    private $themeList;

    /**
     * @var \Magento\Framework\View\DesignInterfaceFactory
     */
    private $designFactory;

    /**
     * @var \Magento\Framework\Locale\ResolverInterfaceFactory
     */
    private $localeFactory;

    /**
     * @param \Magento\Framework\App\State $appState
     * @param \Magento\Framework\View\Design\Theme\ListInterface $themeList
     * @param \Magento\Framework\View\DesignInterfaceFactory $designFactory
     * @param \Magento\Framework\View\LayoutFactory $layoutFactory
     * @param \Magento\Framework\Locale\ResolverInterfaceFactory $localeFactory
     */
    public function __construct(
        \Magento\Framework\App\State $appState,
        \Magento\Framework\View\Design\Theme\ListInterface $themeList,
        \Magento\Framework\View\DesignInterfaceFactory $designFactory,
        \Magento\Framework\View\LayoutFactory $layoutFactory,
        \Magento\Framework\Locale\ResolverInterfaceFactory $localeFactory
    ) {
        $this->appState = $appState;
        $this->themeList = $themeList;
        $this->designFactory = $designFactory;
        $this->layoutFactory = $layoutFactory;
        $this->localeFactory = $localeFactory;
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
        $theme = $this->themeList->getThemeByFullPath($areaCode . '/' . $themePath);
        $design = $this->designFactory->create()->setDesignTheme($theme, $areaCode);
        $locale = $this->localeFactory->create();
        $locale->setLocale($localeCode);
        $design->setLocale($locale);

        // see Magento\PageBuilder\Model\Stage\Renderer
        // see Magento\Widget\Model\Template\Filter
        // see Magento\Email\Model\Template\Filter::emulateAreaCallback
        // lib/internal/Magento/Framework/View/Layout.php::getUpdate - need to inject theme into theme resolver

        $this->appState->emulateAreaCode('frontend', function () {
            $layout = $this->layoutFactory->create(['cacheable' => false]);
            $layout->getUpdate()->addHandle('breeze_default')->load();
            $layout->generateXml();
            $layout->generateElements();

            $block = $layout->getBlock('breeze.js');
            $block->deployBundledAssets();
        });

        return $result;
    }
}
