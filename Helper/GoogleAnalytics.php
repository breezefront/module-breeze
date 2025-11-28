<?php

namespace Swissup\Breeze\Helper;

use Magento\Framework\App\Helper\Context;
use Magento\Framework\App\Helper\AbstractHelper;
use Swissup\Breeze\Helper\Config as ConfigHelper;

class GoogleAnalytics extends AbstractHelper
{
    public function __construct(
        Context $context,
        private ConfigHelper $configHelper
    ) {
        parent::__construct($context);
    }

    private function isEnabled()
    {
        return $this->configHelper->isEnabled('google/analytics/active');
    }

    private function getType()
    {
        return $this->configHelper->getValue('google/analytics/type');
    }

    public function isUniversalAnalyticsEnabled()
    {
        $type = $this->getType();

        return $this->isEnabled() && (!$type || $type === 'universal');
    }

    // Magento Commerce
    public function isTagManagerAnalyticsEnabled()
    {
        return $this->isEnabled() && $this->getType() === 'tag_manager';
    }
}
