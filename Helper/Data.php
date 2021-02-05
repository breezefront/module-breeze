<?php

namespace Swissup\Breeze\Helper;

use Magento\Framework\App\Helper\Context;
use Magento\Framework\App\Helper\AbstractHelper;

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

        if ($this->_getRequest()->getParam('amp')) {
            $this->isEnabled = false;
        } else {
            $this->isEnabled = (bool) $this->getThemeConfig('enabled');
        }

        return $this->isEnabled;
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
}
