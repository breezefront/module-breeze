<?php

namespace Swissup\Breeze\Block;

class Preload extends \Magento\Framework\View\Element\AbstractBlock
{
    private array $items = [];

    private array $allowedAttributes = [
        'as',
        'href',
        'imagesrcset',
        'imagesizes',
        'media',
    ];

    /**
     * @return string
     */
    protected function _toHtml()
    {
        $items = [];

        foreach ($this->items as $attributes) {
            $renderedAttributes = [];
            foreach ($attributes as $name => $value) {
                if (!$value || !in_array($name, $this->allowedAttributes)) {
                    continue;
                }
                $renderedAttributes[] = $name . '="' . $value . '"';
            }
            $renderedAttributes = join(' ', $renderedAttributes);

            $items[$renderedAttributes] = '<link rel="preload" fetchpriority="high" ' . $renderedAttributes . '/>';
        }

        return implode("\n", $items);
    }

    public function addItem($attributes)
    {
        $this->items[] = $attributes;
    }
}
