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

        return str_replace(
            '</head>',
            sprintf("\n%s\n</head>", $this->getJsBlock()->toHtml()),
            $html
        );
    }
}
