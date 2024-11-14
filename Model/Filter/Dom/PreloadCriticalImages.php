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

        $preloadImages = [];
        $preloadBackgrounds = [];
        if (!$this->isProductPage($body)) {
            $preloadImages = $xpath->query(implode('', [
                '//img[@class]',
                '[contains(concat(" ", normalize-space(@class), " "), " data-preload ")]',
                ' | ',
                '//figure[@class]',
                '[contains(concat(" ", normalize-space(@class), " "), " data-preload ")]/img',
            ]), $content);
            $preloadBackgrounds = $xpath->query(implode('', [
                '//div[@data-background-images]',
                '[contains(concat(" ", normalize-space(@class), " "), " data-preload ")]',
            ]), $content);
        }

        if (count($preloadImages) || count($preloadBackgrounds)) {
            $this->walkImgNodes($preloadImages, 10, 10);
            $this->walkBackgroundImgNodes($preloadBackgrounds, 10, 10);
        } elseif ($this->isHomePage($body) || $this->isCmsPage($body)) {
            if (!$this->walkBackgroundImgNodes($xpath->query('//div[@data-background-images]', $content))) {
                $this->walkImgNodes($xpath->query('//div[@class="column main"]//img', $content), 1);
                $this->walkImgNodes($xpath->query('//img[@class="product-image-photo"]', $content));
            }
        } elseif ($this->isProductPage($body)) {
            $this->walkImgNodes($xpath->query('(//img[@class="main-image"])[1]', $content));
        } else {
            $this->walkImgNodes($xpath->query('//div[@class="category-image"]//img', $content), 1);
            $this->walkImgNodes($xpath->query('//img[@class="product-image-photo"]', $content));
        }
    }

    private function walkImgNodes($nodes, $maxLinksToAdd = 2)
    {
        foreach ($nodes as $i => $node) {
            if (!$node->getAttribute('src')) {
                continue;
            }

            $node->removeAttribute('loading');

            $attributes = [
                'as' => 'image',
                'href' => $this->getNodeAttribute($node, 'src'),
                'imagesrcset' => $this->getNodeAttribute($node, 'srcset'),
                'imagesizes' => $this->getNodeAttribute($node, 'sizes'),
            ];

            $class = (string) $node->getAttribute('class');
            if (strpos($class, 'pagebuilder-mobile-hidden') !== false) {
                $attributes['media'] = '(min-width: 768px)';
            } elseif (strpos($class, 'pagebuilder-mobile-only') !== false) {
                $attributes['media'] = '(max-width: 767.98px)';
            }

            $this->addPreloadLink($attributes);

            if ($i + 1 >= $maxLinksToAdd) {
                break;
            }
        }
    }

    private function walkBackgroundImgNodes($nodes, $maxLinksToAdd = 1, $maxNodesToProcess = 4)
    {
        $linksAdded = 0;

        foreach ($nodes as $i => $node) {
            if ($i >= $maxNodesToProcess || $linksAdded >= $maxLinksToAdd) {
                break;
            }

            $attr = $this->getNodeAttribute($node, 'data-background-images');
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

            $linksAdded++;
            $this->addPreloadLink($attributes);
        }

        return $linksAdded;
    }

    private function isCmsPage($body): bool
    {
        return $body && strpos($body->getAttribute('class'), 'cms-page-view') !== false;
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
