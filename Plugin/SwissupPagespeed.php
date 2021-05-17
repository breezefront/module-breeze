<?php

namespace Swissup\Breeze\Plugin;

class SwissupPagespeed
{
    /**
     * @var \Swissup\Breeze\Helper\Data
     */
    private $helper;

    /**
     * @param \Swissup\Breeze\Helper\Data $helper
     */
    public function __construct(
        \Swissup\Breeze\Helper\Data $helper
    ) {
        $this->helper = $helper;
    }

    /**
     * @param \Swissup\Pagespeed\Helper\Config $subject
     * @param boolean $result
     * @return boolean
     */
    public function afterIsDeferJsEnable(
        \Swissup\Pagespeed\Helper\Config $subject,
        $result
    ) {
        if (!$result || !$this->helper->isEnabled()) {
            return $result;
        }

        return false;
    }
}
