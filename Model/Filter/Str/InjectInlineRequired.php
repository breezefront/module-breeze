<?php

namespace Swissup\Breeze\Model\Filter\Str;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class InjectInlineRequired extends AbstractFilter
{
    /**
     * @param  string $html
     * @return string
     */
    public function process($html)
    {
        $block = $this->layout->getBlock('breeze.required');

        if (!$block) {
            return $html;
        }

        return str_replace(
            '</head>',
            sprintf("\n%s\n</head>", $block->toHtml()),
            $html
        );
    }
}
