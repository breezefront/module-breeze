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
        $content = $document->getElementById('maincontent');

        if ($this->isHomePage($body)) {
            $this->walkSliderNodes($xpath->query('(//div[contains(@class, "pagebuilder-slide-wrapper")])[1]', $content));
            $this->walkImgNodes($xpath->query('//img[@class="product-image-photo"]', $content), 5);
        } elseif ($this->isProductPage($body)) {
            $this->walkImgNodes($xpath->query('(//img[@class="main-image"])[1]', $content));
        } else {
            $this->walkImgNodes($xpath->query('//img[@class="product-image-photo"]', $content));
        }
    }

    private function walkImgNodes($nodes, $limit = 3)
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

            if ($i >= $limit) {
                break;
            }
        }
    }

    private function walkSliderNodes($nodes, $limit = 1)
    {
        foreach ($nodes as $i => $node) {
            $attr = (string) $node->getAttribute('data-background-images');
            $attr = json_decode(stripslashes($attr), true);
            if (!$attr || empty($attr['desktop_image'])) {
                continue;
            }

            $attributes = [
                'as' => 'image',
                'href' => $attr['desktop_image'],
            ];

            if (!empty($attr['mobile_image'])) {
                $attributes['imagesrcset'] = $attr['mobile_image'] . ' 768w, ' . $attr['desktop_image'];
                $attributes['imagesizes'] = '100vw';
            }

            $this->addPreloadLink($attributes);

            if ($i >= $limit) {
                break;
            }
        }
    }

    private function isHomePage($body): bool
    {
        return $body && strpos($body->getAttribute('class'), 'cms-index-index') !== false;
    }

    private function isProductPage($body): bool
    {
        return $body && strpos($body->getAttribute('class'), 'catalog-product-view') !== false;
    }
}
