<?php

namespace Swissup\Breeze\Block;

use Magento\Csp\Api\InlineUtilInterface;
use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\App\ObjectManager;

class Css extends \Magento\Framework\View\Element\AbstractBlock
{
    private $assetRepo;

    private $cssResolver;

    private $moduleManager;

    private $filesystem;

    private $curlHelper;

    public function __construct(
        \Magento\Framework\View\Element\Context $context,
        \Magento\Framework\View\Asset\Repository $assetRepo,
        \Magento\Framework\View\Url\CssResolver $cssResolver,
        \Magento\Framework\Module\Manager $moduleManager,
        \Magento\Framework\Filesystem $filesystem,
        \Swissup\Breeze\Helper\Curl $curlHelper,
        array $data = []
    ) {
        parent::__construct($context, $data);

        $this->assetRepo = $assetRepo;
        $this->cssResolver = $cssResolver;
        $this->moduleManager = $moduleManager;
        $this->filesystem = $filesystem;
        $this->curlHelper = $curlHelper;
    }

    /**
     * @return string
     */
    protected function _toHtml()
    {
        $items = [];
        $inlineCss = $this->_scopeConfig->isSetFlag(
            'dev/css/use_css_critical_path',
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
        );

        foreach ($this->getBundles() ?? [] as $name => $data) {
            if ($inlineCss) {
                $items[] = $this->renderCss($name);
            } else {
                $items[] = $this->renderLink($name, $data);
            }

            if (!isset($data['deferred']) || $data['deferred']) {
                // When inlineCss is true, we will defer this style later in Swissup\Breeze\Plugin\AsyncCssPlugin
                $items[] = $this->renderLink('deferred-' . $name, $data, !$inlineCss);
            }
        }

        return implode("\n", array_filter($items));
    }

    /**
     * @param string $name
     * @param array $data
     * @param boolean $deferred
     * @return string
     */
    private function renderLink($name, $data = [], $deferred = false)
    {
        $media = $data['media'] ?? 'all';
        $href = $this->getViewFileUrl('css/' . $name . '.css');
        $onload = '';

        if ($deferred) {
            $onloadValue = sprintf('this.media=\'%s\'', $media);
            $onload = sprintf('onload="%s"', $onloadValue);
            $media = 'print';

            if (interface_exists(InlineUtilInterface::class) &&
                $this->moduleManager->isEnabled('Magento_Csp')
            ) {
                $onload = ObjectManager::getInstance()
                    ->get(InlineUtilInterface::class)
                    ->renderEventListener('onload', $onloadValue);
            }
        }

        return sprintf(
            '<link rel="stylesheet" type="text/css" media="%s" %s href="%s"/>',
            $media,
            $onload,
            $href
        );
    }

    /**
     * @param string $name
     * @return string
     */
    private function renderCss($name)
    {
        $url = $this->getViewFileUrl('css/' . $name . '.css');
        $parts = preg_split('#/static(/version\d+)?/frontend/#', $url);
        $content = false;

        if (!empty($parts[1])) {
            $staticDir = $this->filesystem->getDirectoryRead(DirectoryList::STATIC_VIEW);
            $path = 'frontend/' . $parts[1];

            if ($staticDir->isExist($path)) {
                $content = $staticDir->readFile($path);
            }
        }

        if ($content === false) {
            $content = $this->curlHelper->deployAndRead($url);
        }

        $asset = $this->assetRepo->createAsset('css/' . $name . '.css', ['_secure' => 'false']);
        $content = $this->removeSourceMap($content);
        $content = $this->cssResolver->relocateRelativeUrls($content, $asset->getUrl(), '..');

        $content = str_replace("\n", ' ', $content);
        $content = preg_replace('/\s{2,}/', ' ', $content);

        return '<style>' . $content . '</style>';
    }

    private function removeSourceMap($content)
    {
        $start = '/*# sourceMappingURL=data:application/json,%7B%';
        $end = '%22%7D */';
        $startPos = strrpos($content, $start);
        $endPos = strrpos($content, $end);

        if ($startPos !== false && $endPos !== false && $endPos > $startPos) {
            $endPos += strlen($end);
            $content = substr_replace($content, '', $startPos, $endPos - $startPos);
            $content = rtrim($content);
        }

        return $content;
    }
}
