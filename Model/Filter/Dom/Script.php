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
            if ($node->hasAttribute('data-breeze-remove')) {
                $remove[] = $node;
                continue;
            }

            if ($node->hasAttribute('data-breeze')
                || $node->hasAttribute('src')
                || $node->getAttribute('type') === 'text/x-magento-init'
                || $node->getAttribute('type') === 'application/ld+json'
                || $node->getAttribute('type') === 'application/json'
            ) {
                continue;
            }

            if ($node->textContent &&
                strpos($node->textContent, 'require(') === false &&
                strpos($node->textContent, 'requirejs(') === false &&
                // strpos($node->textContent, 'require =') === false &&
                strpos($node->textContent, 'require.') === false
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
