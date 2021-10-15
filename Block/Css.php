<?php

namespace Swissup\Breeze\Block;

class Css extends \Magento\Framework\View\Element\AbstractBlock
{
    /**
     * @return string
     */
    protected function _toHtml()
    {
        $items = [];

        foreach ($this->getBundles() ?? [] as $name => $data) {
            $items[] = $this->renderLink($name);
            $items[] = $this->renderLink($name, true);
        }

        return implode("\n", $items);
    }

    /**
     * @param string $name
     * @param boolean $deferred
     * @return string
     */
    private function renderLink($name, $deferred = false)
    {
        if ($deferred) {
            $template = '<link rel="stylesheet" type="text/css" media="print" onload="media=\'all\'" href="%s"/>';
            $href = 'css/deferred-' . $name . '.css';
        } else {
            $template = '<link rel="stylesheet" type="text/css" media="all" href="%s"/>';
            $href = 'css/' . $name . '.css';
        }

        return sprintf($template, $this->getViewFileUrl($href));
    }
}
