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

        $this->collect($document, $xpath);

        $templates = $xpath->query('//*[@type="text/x-magento-template"]');
        foreach ($templates as $template) {
            $doc = new \DOMDocument();
            $doc->loadHTML(str_replace('<\/', '</', $template->textContent));
            $this->collect($doc, new \DOMXPath($doc));
        }
    }

    /**
     * @param \DOMDocument $document
     * @param \DOMXPath $xpath
     */
    private function collect(\DOMDocument $document, \DOMXPath $xpath)
    {
        $nodes = $xpath->query('//*[@data-mage-init-lazy]', $document);
        foreach ($nodes as $node) {
            $node->setAttribute('data-mage-init', $node->getAttribute('data-mage-init-lazy'));
            $node->removeAttribute('data-mage-init-lazy');
        }

        $nodes = $xpath->query('//*[@data-mage-init]', $document);
        foreach ($nodes as $node) {
            $value = $node->getAttribute('data-mage-init');
            $value = json_decode($value, true);
            if (!$value) {
                continue;
            }
            foreach (array_keys($value) as $name) {
                $this->addComponent($name);
            }
        }

        $nodes = $xpath->query('//*[@type="text/x-magento-init"]', $document);
        foreach ($nodes as $node) {
            $value = json_decode($node->textContent, true);
            foreach ($value as $selector => $components) {
                foreach ($components as $component => $config) {
                    if ($component === 'Magento_Ui/js/core/app') {
                        $this->collectNestedComponents($config['components'] ?? []);
                    } elseif (empty($config['componentDisabled'])) {
                        $this->addComponent($component);
                    }
                }
            }
        }

        $nodes = $xpath->query('//*[@data-enable-parallax="1"]', $document);
        if (count($nodes)) {
            $this->addComponent('parallax');
        }

        $nodes = $xpath->query('//*[@data-background-type="video"]', $document);
        if (count($nodes)) {
            $this->addComponent('video-background');
        }
    }

    private function collectNestedComponents($components)
    {
        foreach ($components as $key => $settings) {
            if (!empty($settings['component']) && empty($settings['componentDisabled'])) {
                $this->addComponent($settings['component']);
            }
            $this->collectNestedComponents($settings['children'] ?? []);
        }
    }
}
