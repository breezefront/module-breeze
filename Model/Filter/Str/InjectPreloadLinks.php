<?php

namespace Swissup\Breeze\Model\Filter\Str;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class InjectPreloadLinks extends AbstractFilter
{
    /**
     * @param  string $html
     * @return string
     */
    public function process($html)
    {
        if (!$this->getPreloadBlock()) {
            return $html;
        }

        // insert preload before first "<link "
        $needle = '<link ';
        $pos = strpos($html, $needle);
        if ($pos === false) {
            return $html;
        }

        return substr_replace(
            $html,
            sprintf("\n%s\n%s", $this->getPreloadBlock()->toHtml(), $needle),
            $pos,
            strlen($needle)
        );
    }
}
