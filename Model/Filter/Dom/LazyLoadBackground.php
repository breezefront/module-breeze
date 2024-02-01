<?php

namespace Swissup\Breeze\Model\Filter\Dom;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class LazyLoadBackground extends AbstractFilter
{
    public function process(\DOMDocument $document)
    {
        $xpath = new \DOMXPath($document);
        $content = $document->getElementById('maincontent');
        $nodes = $xpath->query('//div[@data-background-images]', $content);
        $i = 0;

        foreach ($nodes as $node) {
            $attr = (string) $node->getAttribute('data-background-images');
            $attr = json_decode(stripslashes($attr), true);
            if (!$attr) {
                continue;
            }

            if ($i++ === 0) {
                continue;
            }

            // see Swissup_Breeze/js/common/theme.js
            $node->setAttribute('style', 'background-image: none;' . (string) $node->getAttribute('style'));
            $node->setAttribute('class', 'breeze-bg-lazy ' . (string) $node->getAttribute('class'));
        }
    }
}
