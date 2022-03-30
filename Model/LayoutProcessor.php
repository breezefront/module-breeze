<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\App\DeploymentConfig;
use Magento\Framework\App\ObjectManager;

class LayoutProcessor extends \Magento\Framework\View\Model\Layout\Merge
{
    /**
     * @var DeploymentConfig
     */
    private $deploymentConfig;

    protected function _fetchDbLayoutUpdates($handle)
    {
        if (!$this->getDeploymentConfig()->isDbAvailable()) {
            return false;
        }

        return parent::_fetchDbLayoutUpdates();
    }

    /**
     * @return DeploymentConfig
     */
    private function getDeploymentConfig()
    {
        if (!$this->deploymentConfig) {
            $this->deploymentConfig = ObjectManager::getInstance()->get(DeploymentConfig::class);
        }

        return $this->deploymentConfig;
    }
}
