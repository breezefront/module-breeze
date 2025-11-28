<?php

namespace Swissup\Breeze\Plugin;

use Magento\Framework\App\DeploymentConfig;
use Magento\Framework\View\Layout\ProcessorInterface;

class LayoutProcessor
{
    public function __construct(
        private DeploymentConfig $deploymentConfig
    ) {
    }

    public function aroundGetDbUpdateString(ProcessorInterface $subject, callable $proceed, $handle)
    {
        if (!$this->deploymentConfig->isDbAvailable()) {
            return '';
        }

        return $proceed($handle);
    }
}
