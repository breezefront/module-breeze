<?php

namespace Swissup\Breeze\Plugin;

class SwissupAjaxproCustomerData
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
     * @param mixed $subject
     * @param mixed $result
     * @return mixed
     */
    public function beforeGetBlockHtml(
        $subject,
        $blockName,
        $handles
    ) {
        if (!$this->helper->isEnabled()) {
            return;
        }

        $breezeHandles = [];
        foreach ($handles as $handle) {
            if (strpos($handle, 'breeze_') === 0) {
                continue;
            }

            $breezeHandles[] = 'breeze_' . $handle;
        }

        $handles = array_merge($handles, $breezeHandles);

        return [$blockName, $handles];
    }
}
