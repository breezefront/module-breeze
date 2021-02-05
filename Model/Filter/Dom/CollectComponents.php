<?php

namespace Swissup\Breeze\Model\Filter\Dom;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class CollectComponents extends AbstractFilter
{
    /**
     * @param  \DOMDocument $document
     * @return void
     */
    public function process(\DOMDocument $document)
    {
        $xpath = new \DOMXPath($document);
        $nodes = $xpath->query('//*[@data-mage-init]', $document);

        foreach ($nodes as $node) {
            $value = $node->getAttribute('data-mage-init');
            $value = json_decode($value, true);
            foreach (array_keys($value) as $name) {
                $this->addComponent($name);
            }
        }
    }
}
