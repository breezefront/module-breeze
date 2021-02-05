<?php

namespace Swissup\Breeze\Plugin;

class AppConfig
{
    /**
     * @var \Swissup\Breeze\Helper\Data
     */
    protected $helper;

    /**
     * @param \Swissup\Breeze\Helper\Data $helper
     */
    public function __construct(
        \Swissup\Breeze\Helper\Data $helper
    ) {
        $this->helper = $helper;
    }

    /**
     * @param \Magento\Framework\App\Config $subject
     * @param bool $result
     * @param string $path
     * @return bool
     */
    public function afterIsSetFlag(
        \Magento\Framework\App\Config $subject,
        $result,
        $path
    ) {
        if ($path === 'dev/js/move_script_to_bottom' && $this->helper->isEnabled()) {
            return false;
        }

        return $result;
    }
}
