<?php

namespace Swissup\Breeze\Model\Filter\Str;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class InjectComponents extends AbstractFilter
{
    /**
     * @param  string $html
     * @return string
     */
    public function process($html)
    {
        if (!$this->getJsBlock()) {
            return $html;
        }

        return $this->insertBefore($html, '</head>', $this->getJsBlock()->toHtml());
    }
}
