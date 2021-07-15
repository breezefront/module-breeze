<?php

namespace Swissup\Breeze\Plugin;

class SwissupProLabels
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
     * @return string
     */
    public function afterGetBaseImageWrapConfig(
        \Swissup\ProLabels\Block\Product\Labels $subject,
        $result
    ) {
        if (!$this->helper->isEnabled()) {
            return $result;
        }

        return $result . ', .breeze-gallery .main-image-wrapper';
    }
}
