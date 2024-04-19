<?php

namespace Swissup\Breeze\Block;

class Css extends \Magento\Framework\View\Element\AbstractBlock
{
    private $assetRepo;

    private $cssResolver;

    public function __construct(
        \Magento\Framework\View\Element\Context $context,
        \Magento\Framework\View\Asset\Repository $assetRepo,
        \Magento\Framework\View\Url\CssResolver $cssResolver,
        array $data = []
    ) {
        parent::__construct($context, $data);

        $this->assetRepo = $assetRepo;
        $this->cssResolver = $cssResolver;
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
                if ($inlineCss) {
                    // We will defer this style in Swissup\Breeze\Plugin\AsyncCssPlugin
                    $items[] = $this->renderLink('deferred-' . $name, $data);
                } else {
                    $items[] = $this->renderLink($name, $data, true);
                }
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
        $media = 'all';

        if (!empty($data['media'])) {
            $media = $data['media'];
        }

        if ($deferred) {
            $template = '<link rel="stylesheet" type="text/css" media="print" onload="media=\'' . $media . '\'" href="%s"/>';
            $href = 'css/deferred-' . $name . '.css';
        } else {
            $template = '<link rel="stylesheet" type="text/css" media="' . $media . '" href="%s"/>';
            $href = 'css/' . $name . '.css';
        }

        return sprintf($template, $this->getViewFileUrl($href));
    }

    /**
     * @param string $name
     * @return string
     */
    private function renderCss($name)
    {
        try {
            $asset = $this->assetRepo->createAsset('css/' . $name . '.css', ['_secure' => 'false']);
            $content = $asset->getContent();
            $content = $this->cssResolver->relocateRelativeUrls($content, $asset->getUrl(), '..');
        } catch (\Exception $e) {
            return '';
        }

        $content = str_replace("\n", ' ', $content);
        $content = preg_replace('/\s{2,}/', ' ', $content);

        return '<style>' . $content . '</style>';
    }
}
