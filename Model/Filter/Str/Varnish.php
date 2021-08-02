<?php

namespace Swissup\Breeze\Model\Filter\Str;

use Magento\PageCache\Model\Config as PageCacheConfig;

class Varnish
{
    /**
     * @var PageCacheConfig
     */
    protected $pageCacheConfig;

    /**
     * @param PageCacheConfig $pageCacheConfig
     */
    public function __construct(
        PageCacheConfig $pageCacheConfig
    ) {
        $this->pageCacheConfig = $pageCacheConfig;
    }

    /**
     * Varnish ESI fix: replace <include> tag with <esi:include>
     *
     * @param  string $html
     * @return string
     */
    public function process($html)
    {
        $replaceMapping = [
            '<include src=' => '<esi:include src=',
            '</include>' => '</esi:include>'
        ];

        foreach ($replaceMapping as $search => $replace) {
            $html = str_replace($search, $replace, $html);
        }

        return $html;
    }
}
