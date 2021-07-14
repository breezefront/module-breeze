<?php

namespace Swissup\Breeze\Plugin;

class SwissupAjaxpro
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
     * @param \Swissup\Ajaxpro\Helper\Config $subject
     * @param boolean $result
     * @return boolean
     */
    public function afterGetCartHandle(
        \Swissup\Ajaxpro\Helper\Config $subject,
        $result
    ) {
        if (!$this->helper->isEnabled()) {
            return $result;
        }

        if ($result === 'ajaxpro_popup_checkout_cart_index_fixes') {
            $result = 'ajaxpro_popup_minicart';
        }

        return $result;
    }
}
