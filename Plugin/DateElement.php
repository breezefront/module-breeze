<?php

namespace Swissup\Breeze\Plugin;

class DateElement
{
    private \Swissup\Breeze\Helper\Data $helper;

    public function __construct(\Swissup\Breeze\Helper\Data $helper)
    {
        $this->helper = $helper;
    }

    public function afterToHtml(
        \Magento\Framework\View\Element\Html\Date $subject,
        $result
    ) {
        if ($this->helper->isEnabled()) {
            $result = str_replace('<script', '<script data-breeze', $result);
        }

        return $result;
    }
}
