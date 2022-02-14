<?php

namespace Swissup\Breeze\Model\Filter\Dom;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class PreloadCriticalImages extends AbstractFilter
{
    /**
     * Remove lazyload and add preload meta tags for above the fold images
     */
    public function process(\DOMDocument $document)
    {
        $xpath = new \DOMXPath($document);
        $body = $document->getElementsByTagName('body')->item(0);

        if (strpos($body->getAttribute('class'), 'catalog-product-view') !== false) {
            $this->walk($xpath->query('//main[@id="maincontent"]//img[@class="main-image"]', $document));
        } else {
            $this->walk($xpath->query('//main[@id="maincontent"]//img[@class="product-image-photo"]', $document));
        }
    }

    private function walk($nodes)
    {
        foreach ($nodes as $i => $node) {
            if (!$node->getAttribute('src')) {
                continue;
            }

            $node->removeAttribute('loading');

            $this->addPreloadLink([
                'as' => 'image',
                'href' => $node->getAttribute('src'),
                'imagesrcset' => $node->getAttribute('srcset'),
                'imagesizes' => $node->getAttribute('sizes'),
            ]);

            if ($i >= 3) {
                break;
            }
        }
    }
}
