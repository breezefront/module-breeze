<?php

namespace Swissup\Breeze\Block\Theme;

use Magento\Framework\View\Element\AbstractBlock;

class CriticalImages extends AbstractBlock
{
    public function getImageXpaths()
    {
        return array_filter($this->getData('image_xpaths'));
    }

    public function getBackgroundXpaths()
    {
        return array_filter($this->getData('background_xpaths'));
    }
}
