<?php

namespace Swissup\Breeze\Model\Filter;

use Swissup\Breeze\Model\DomDocument;
use Magento\Framework\View\LayoutInterface;

class AbstractFilter
{
    public function __construct(
        protected LayoutInterface $layout,
        protected DomDocument $domDocument
    ) {
    }

    protected function getNodeAttribute($node, $code): string
    {
        return $this->domDocument->getNodeAttribute($node, $code);
    }

    /**
     * @param array $attributes
     */
    protected function addPreloadLink($attributes)
    {
        if ($block = $this->getPreloadBlock()) {
            $block->addItem($attributes);
        }
    }

    /**
     * @return \Swissup\Breeze\Block\Js
     */
    protected function getJsBlock()
    {
        return $this->layout->getBlock('breeze.js');
    }

    /**
     * @return \Swissup\Breeze\Block\Preload
     */
    protected function getPreloadBlock()
    {
        return $this->layout->getBlock('breeze.preload');
    }

    protected function insertBefore($haystack, $needle, $string): string
    {
        $pos = strpos($haystack, $needle);

        if ($pos === false) {
            return $haystack;
        }

        return substr_replace(
            $haystack,
            sprintf("\n%s\n%s", $string, $needle),
            $pos,
            strlen($needle)
        );
    }
}
