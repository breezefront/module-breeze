<?php

namespace Swissup\Breeze\Helper;

use Magento\Framework\App\Helper\Context;
use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Framework\View\ConfigInterface;
use Magento\Store\Model\ScopeInterface;

class Data extends AbstractHelper
{
    private ?bool $isEnabled = null;

    private ?bool $isResponsiveImagesEnabled = null;

    public function __construct(
        Context $context,
        private ConfigInterface $viewConfig
    ) {
        parent::__construct($context);
    }

    /**
     * @return boolean
     */
    public function isEnabled()
    {
        if ($this->isEnabled !== null) {
            return $this->isEnabled;
        }

        if ($this->_getRequest()->getParam('amp') || $this->isUrlExcluded()) {
            $this->isEnabled = false;
        } else {
            $isEnabled = $this->getConfig('design/breeze/enabled');

            if ($isEnabled === 'theme') {
                $isEnabled = $this->getThemeConfig('enabled');
            }

            $this->isEnabled = (bool) $isEnabled;
        }

        if ($this->isEnabled) {
            $this->isEnabled = $this->isCurrentPageSupported();
        }

        if ($this->getConfig('design/breeze/debug')) {
            $flag = $this->_getRequest()->getParam('breeze');
            $isAjax = $this->_request->isAjax();
            $referer = $this->_request->getServer('HTTP_REFERER');

            if ($flag !== null) {
                $this->isEnabled = (bool) $flag;
            } elseif ($isAjax && $referer && $query = parse_url($referer, PHP_URL_QUERY)) {
                parse_str($query, $params);
                if (isset($params['breeze'])) {
                    $this->isEnabled = (bool) $params['breeze'];
                }
            }
        }

        return $this->isEnabled;
    }

    /**
     * @return array
     */
    public function getExcludedUrls()
    {
        $excludedUrls = trim((string)$this->getConfig('design/breeze/excluded_urls'));
        $excludedUrls = array_filter(explode("\n", $excludedUrls));

        foreach ($excludedUrls as $i => $url) {
            $excludedUrls[$i] = trim($url);
        }

        $excludedUrls[] = '/redirect/';
        // $excludedUrls[] = '/checkout/';
        $excludedUrls[] = '/multishipping/';

        return $excludedUrls;
    }

    /**
     * @return array
     */
    public function getExcludeExceptionUrls()
    {
        $exceptionUrls = trim((string)$this->getConfig('design/breeze/excluded_urls_exceptions'));
        $exceptionUrls = array_filter(explode("\n", $exceptionUrls));

        foreach ($exceptionUrls as $i => $url) {
            $exceptionUrls[$i] = trim($url);
        }

        $exceptionUrls[] = 'checkout/cart/configure';
        $exceptionUrls[] = 'customer/section/load';

        return $exceptionUrls;
    }

    /**
     * @param string $url
     * @return boolean
     */
    protected function isUrlExcluded($url = null)
    {
        if (!$url) {
            $url = $this->_getRequest()->getRequestUri();
        }

        foreach ($this->getExcludeExceptionUrls() as $exceptionUrl) {
            if (strpos($url, trim($exceptionUrl)) === false) {
                continue;
            }

            return false;
        }

        foreach ($this->getExcludedUrls() as $excludedUrl) {
            if (strpos($url, trim($excludedUrl)) === false) {
                continue;
            }

            return true;
        }

        return false;
    }

    protected function isCurrentPageSupported()
    {
        $page = $this->_request->getFullActionName();
        $handle = str_replace('_', '/', $page);

        if (in_array($handle, $this->getExcludeExceptionUrls())) {
            return true;
        }

        if ($this->_request->isAjax()) {
            $referer = $this->_request->getServer('HTTP_REFERER');

            if ($referer && $this->isUrlExcluded($referer)) {
                return false;
            }
        }

        if ($page === 'checkout_cart_index') {
            return true;
        }

        return strpos($page, 'checkout_') === false
            && strpos($page, 'multishipping_') === false;
    }

    /**
     * @return boolean
     */
    public function isResponsiveImagesEnabled()
    {
        if ($this->isResponsiveImagesEnabled !== null) {
            return $this->isResponsiveImagesEnabled;
        }

        $result = $this->getConfig('design/breeze/responsive_images');

        if ($result === 'theme') {
            $result = $this->getThemeConfig('responsive_images');
        }

        $this->isResponsiveImagesEnabled = (bool) $result;

        return $this->isResponsiveImagesEnabled;
    }

    public function isBetterCompatibilityEnabled()
    {
        $flag = $this->scopeConfig->isSetFlag(
            'design/breeze/better_compatibility',
            ScopeInterface::SCOPE_STORE
        );

        if (!$flag && $this->getConfig('design/breeze/debug')) {
            $flag = (bool) $this->_getRequest()->getParam('compat');
        }

        return $flag;
    }

    /**
     * @param string $key
     * @param string $module
     * @return string
     */
    public function getThemeConfig($key, $module = 'Swissup_Breeze')
    {
        return $this->getViewConfig()->getVarValue($module, $key);
    }

    /**
     * @param  string $path
     * @param  string $scope
     * @return string
     */
    public function getConfig($path, $scope = ScopeInterface::SCOPE_STORE)
    {
        return $this->scopeConfig->getValue($path, $scope);
    }

    /**
     * @param  string $path
     * @param  string $scope
     * @return string
     */
    public function getViewConfig()
    {
        return $this->viewConfig->getViewConfig();
    }
}
