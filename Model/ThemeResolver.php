<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\View\Design\ThemeInterface;
use Magento\Framework\View\Design\Theme\ResolverInterface;

class ThemeResolver implements ResolverInterface
{
    private $theme;

    public function set(ThemeInterface $theme)
    {
        $this->theme = $theme;
    }

    public function get(): ThemeInterface
    {
        return $this->theme;
    }
}
