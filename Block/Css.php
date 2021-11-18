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
            $items[] = $this->renderLink($name, $data);
            if (!isset($data['deferred']) || $data['deferred']) {
                $items[] = $this->renderLink($name, $data, true);
            }
        }

        return implode("\n", $items);
    }

    /**
     * @param string $name
     * @param array $data
     * @param boolean $deferred
     * @return string
     */
    private function renderLink($name, $data = [], $deferred = false)
    {
        $media = 'all';

        if (!empty($data['media'])) {
            $media = $data['media'];
        }

        if ($deferred) {
            $template = '<link rel="stylesheet" type="text/css" media="print" onload="media=\'' . $media . '\'" href="%s"/>';
            $href = 'css/deferred-' . $name . '.css';
        } else {
            $template = '<link rel="stylesheet" type="text/css" media="' . $media . '" href="%s"/>';
            $href = 'css/' . $name . '.css';
        }

        return sprintf($template, $this->getViewFileUrl($href));
    }
}
