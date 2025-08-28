<?php

namespace Swissup\Breeze\Model\Filter\Str;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class InjectJsClass extends AbstractFilter
{
    /**
     * @param  string $html
     * @return string
     */
    public function process($html)
    {
        $block = $this->layout->getBlock('breeze.jsClass');

        if (!$block) {
            return $html;
        }

        return $this->insertBefore($html, '<link ', $block->toHtml());
    }
}
