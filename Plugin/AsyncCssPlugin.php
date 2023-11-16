<?php

namespace Swissup\Breeze\Plugin;

use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;
use Magento\Framework\App\Response\Http;
use Magento\Framework\App\Response\HttpInterface as HttpResponseInterface;
use Magento\Framework\App\ResponseInterface;
use Magento\Framework\View\Result\Layout;

class AsyncCssPlugin
{
    private const XML_PATH_USE_CSS_CRITICAL_PATH = 'dev/css/use_css_critical_path';

    private ScopeConfigInterface $scopeConfig;

    public function __construct(ScopeConfigInterface $scopeConfig)
    {
        $this->scopeConfig = $scopeConfig;
    }

    public function afterRenderResult(Layout $subject, Layout $result, ResponseInterface $httpResponse)
    {
        if (!$this->isCssCriticalEnabled()) {
            return $result;
        }

        $content = (string) $httpResponse->getContent();
        $headEndTagPos = strpos($content, '</head>');
        if ($headEndTagPos === false) {
            return $result;
        }

        // Modified logic from Magento/Theme/Controller/Result/AsyncCssPlugin
        // We do not change the order of the link tags
        $styleOpen = '<link';
        $styleClose = '>';
        $styleOpenPos = strpos($content, $styleOpen);

        while ($styleOpenPos !== false) {
            $styleClosePos = strpos($content, $styleClose, $styleOpenPos);
            $style = substr($content, $styleOpenPos, $styleClosePos - $styleOpenPos + strlen($styleClose));

            if (!preg_match('@rel=["\']stylesheet["\']@', $style)) {
                // Link is not a stylesheet
                $styleOpenPos = strpos($content, $styleOpen, $styleClosePos);
                continue;
            }

            if (!preg_match('@href=("|\')(.*?)\1@', $style, $hrefAttribute)) {
                // Invalid link syntax
                continue;
            }

            preg_match('@media=("|\')(.*?)\1@', $style, $mediaAttribute);
            $asyncStyle = sprintf(
                '<link rel="stylesheet" media="print" onload="this.onload=null;this.media=\'%s\'" href="%s">',
                $mediaAttribute[2] ?? 'all',
                $hrefAttribute[2]
            );

            $content = str_replace($style, $asyncStyle, $content);
            $styleOpenPos = strpos($content, $styleOpen, $styleOpenPos + strlen($asyncStyle));
        }

        $httpResponse->setContent($content);

        return $result;
    }

    private function isCssCriticalEnabled(): bool
    {
        return $this->scopeConfig->isSetFlag(
            self::XML_PATH_USE_CSS_CRITICAL_PATH,
            ScopeInterface::SCOPE_STORE
        );
    }
}
