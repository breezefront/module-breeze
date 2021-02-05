<?php

namespace Swissup\Breeze\Model\Filter\Dom;

class Script
{
    /**
     * Removes <script> tags from the DOMDocument
     *
     * @param  \DOMDocument $document
     * @return void
     */
    public function process(\DOMDocument $document)
    {
        $remove = [];

        $nodes = $document->getElementsByTagName('script');
        foreach ($nodes as $node) {
            // if ($node->getAttribute('type') === 'text/javascript') {
            //     $node->removeAttribute('type');
            // }

            if ($node->hasAttribute('data-breeze')
                || $node->getAttribute('type') === 'application/ld+json'
                || $node->getAttribute('type') === 'application/json'
            ) {
                continue;
            }

            $remove[] = $node;
        }

        foreach ($remove as $node) {
            $node->parentNode->removeChild($node);
        }
    }
}
