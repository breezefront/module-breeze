<?php

namespace Swissup\Breeze\Helper;

use Magento\Framework\App\Helper\Context;
use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Store\Model\ScopeInterface;

class Data extends AbstractHelper
{
    /**
     * @var boolean
     */
    private $isEnabled = null;

    /**
     * @param Context $context
     * @param \Magento\Framework\View\ConfigInterface $viewConfig
     */
    public function __construct(
        Context $context,
        \Magento\Framework\View\ConfigInterface $viewConfig
    ) {
        parent::__construct($context);

        $this->viewConfig = $viewConfig;
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
            $this->isEnabled = $this->getConfig('design/breeze/enabled');

            if ($this->isEnabled === 'theme') {
                $this->isEnabled = $this->getThemeConfig('enabled');
            }

            $this->isEnabled = (bool) $this->isEnabled;
        }

        if ($this->isEnabled) {
            $this->isEnabled = $this->isCurrentPageSupported();
        }

        if ($this->getConfig('design/breeze/debug')) {
            $flag = $this->_getRequest()->getParam('breeze');
            if ($flag !== null) {
                $this->isEnabled = (bool) $flag;
            }
        }

        return $this->isEnabled;
    }

    /**
     * @return array
     */
    public function getExcludedUrls()
    {
        $excludedUrls = trim($this->getConfig('design/breeze/excluded_urls'));
        $excludedUrls = array_filter(explode("\n", $excludedUrls));

        foreach ($excludedUrls as $i => $url) {
            $excludedUrls[$i] = trim($url);
        }

        $excludedUrls[] = '/redirect/';
        $excludedUrls[] = '/checkout/';
        $excludedUrls[] = '/multishipping/';

        return $excludedUrls;
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

        return strpos($page, 'checkout_') === false
            && strpos($page, 'multishipping_') === false;
    }

    /**
     * @return boolean
     */
    public function isTurboEnabled()
    {
        $result = $this->getConfig('design/breeze/turbo');

        if ($result === 'theme') {
            $result = $this->getThemeConfig('turbo');
        }

        return (bool) $result;
    }

    /**
     * @param string $key
     * @return string
     */
    public function getThemeConfig($key)
    {
        return $this->viewConfig
            ->getViewConfig()
            ->getVarValue('Swissup_Breeze', $key);
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
}
