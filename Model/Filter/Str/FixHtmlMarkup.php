<?php

namespace Swissup\Breeze\Model\Filter\Str;

class FixHtmlMarkup
{
    public function process($html)
    {
        $html = $this->fixVarnishIncludes($html);
        return $html;
    }

    /**
     * Varnish ESI fix: replace <include> tag with <esi:include>
     */
    private function fixVarnishIncludes($html)
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
