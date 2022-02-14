<?php

namespace Swissup\Breeze\Model\Filter\Str;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class InjectPreloadLinks extends AbstractFilter
{
    /**
     * @param  string $html
     * @return string
     */
    public function process($html)
    {
        if (!$this->getPreloadBlock()) {
            return $html;
        }

        return str_replace(
            '</head>',
            sprintf("\n%s\n</head>", $this->getPreloadBlock()->toHtml()),
            $html
        );
    }
}
