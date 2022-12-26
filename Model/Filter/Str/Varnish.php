<?php

namespace Swissup\Breeze\Model\Filter\Str;

class Varnish
{
    /**
     * Varnish ESI fix: replace <include> tag with <esi:include>
     *
     * @param  string $html
     * @return string
     */
    public function process($html)
    {
        $replaceMapping = [
            '<include src=' => '<esi:include src=',
            '</include>' => '</esi:include>'
        ];

        foreach ($replaceMapping as $search => $replace) {
            $html = str_replace($search, $replace, $html);
        }

        return $html;
    }
}
