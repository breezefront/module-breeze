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
        }

        foreach ($remove as $node) {
            $node->parentNode->removeChild($node);
        }
    }
}
