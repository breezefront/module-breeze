<?php

namespace Swissup\Breeze\Model\Filter\Str;

class ReplaceJqueryCalls
{
    public function process($html)
    {
        $replaceMapping = [
            'window.jQuery.mage.' => '$.mage.',
        ];

        foreach ($replaceMapping as $search => $replace) {
            $html = str_replace($search, $replace, $html);
        }

        return $html;
    }
}
