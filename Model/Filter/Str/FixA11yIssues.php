<?php

namespace Swissup\Breeze\Model\Filter\Str;

class FixA11yIssues
{
    public function process($html)
    {
        $replaceMapping = [
            // Fix "Elements use prohibited ARIA attributes"
            ' aria-labelledby="block-upsell-heading"' => '',
            ' aria-labelledby="block-related-heading"' => '',
            ' aria-labelledby="block-crosssell-heading"' => '',
            ' aria-labelledby="block-widgetgrid-heading"' => '',
        ];

        foreach ($replaceMapping as $search => $replace) {
            $html = str_replace($search, $replace, $html);
        }

        return $html;
    }
}
