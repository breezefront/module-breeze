<?php

namespace Swissup\Breeze\Model\Filter\Str;

class FixHtmlMarkup
{
    public function process($html)
    {
        $html = $this->fixVarnishIncludes($html);
        $html = $this->fixQuotesInDataMageInit($html);
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

    /**
     * Newer libxml versions break markup of the widget rendered inside html element:
     * data-mage-init='{".."}' becomes data-mage-init="{".."}"
     * This code revert the broken data-mage-init attributes to data-mage-init='{".."}'
     */
    private function fixQuotesInDataMageInit($html)
    {
        $search = 'data-mage-init="{"';
        $replace = 'data-mage-init=\'{"';
        $searchLen = strlen($search);
        $offset = 0;

        while (($pos = strpos($html, $search, $offset)) !== false) {
            $closePos = strpos($html, '}"', $pos + $searchLen);
            if ($closePos === false) {
                break;
            }

            $html = substr_replace($html, "}'", $closePos, 2);
            $html = substr_replace($html, $replace, $pos, $searchLen);
            $offset = $closePos + 2;
        }

        return $html;
    }
}
