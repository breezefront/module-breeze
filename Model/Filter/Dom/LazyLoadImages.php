<?php

namespace Swissup\Breeze\Model\Filter\Dom;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class LazyLoadImages extends AbstractFilter
{
    public function process(\DOMDocument $document)
    {
        $xpath = new \DOMXPath($document);

        // Automatically lazyload pagebuilder backgrounds except first one
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

        $lazyImagesBlock = $this->getLazyImagesBlock();
        if (!$lazyImagesBlock) {
            return;
        }

        if ($xpaths = $lazyImagesBlock->getImageXpaths()) {
            $images = $xpath->query(implode(' | ', $xpaths));
            foreach ($images as $node) {
                $node->setAttribute('loading', 'lazy');
                $node->setAttribute('fetchpriority', 'low');
            }
        }

        if ($xpaths = $lazyImagesBlock->getBackgroundXpaths()) {
            $backgrounds = $xpath->query(implode(' | ', $xpaths));
            foreach ($backgrounds as $node) {
                // see Swissup_Breeze/js/common/theme.js
                $node->setAttribute('style', 'background-image: none;' . (string) $node->getAttribute('style'));
                $node->setAttribute('class', 'breeze-bg-lazy ' . (string) $node->getAttribute('class'));
            }
        }
    }

    private function getLazyImagesBlock()
    {
        return $this->layout->getBlock('breeze.lazyImages');
    }
}
