<?php

namespace Swissup\Breeze\Helper;

use Magento\Framework\App\Helper\Context;
use Magento\Framework\App\Helper\AbstractHelper;

class GoogleAnalytics extends AbstractHelper
{
    /**
     * @param Context $context
     * @param Config $configHelper
     */
    public function __construct(
        Context $context,
        Config $configHelper
    ) {
        parent::__construct($context);

        $this->configHelper = $configHelper;
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

        return $this->isEnabled()
            && (!$type || $type === 'universal')
            && $this->configHelper->isEnabled('google/analytics/account');
    }

    // Magento 2.4.5 Gtag module
    public function isGtagAnalyticsEnabled()
    {
        return $this->configHelper->isEnabled('google/gtag/analytics4/active')
            && $this->configHelper->isEnabled('google/gtag/analytics4/measurement_id');
    }

    // Magento 2.4.5 Gtag module
    public function isGtagAdwordsEnabled()
    {
        return $this->configHelper->isEnabled('google/gtag/adwords/active')
            && $this->configHelper->isEnabled('google/gtag/adwords/conversion_id')
            && $this->configHelper->isEnabled('google/gtag/adwords/conversion_label');
    }

    // Magento Commerce
    public function isTagManagerAnalyticsEnabled()
    {
        return $this->isEnabled()
            && $this->getType() === 'tag_manager'
            && $this->configHelper->isEnabled('google/analytics/container_id');
    }
}
