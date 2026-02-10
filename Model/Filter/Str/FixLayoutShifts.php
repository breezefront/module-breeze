<?php

namespace Swissup\Breeze\Model\Filter\Str;

use Magento\Framework\Escaper;

class FixLayoutShifts
{
    public function __construct(
        private Escaper $escaper
    ) {
    }

    public function process($html)
    {
        $home = $this->escaper->escapeHtml(__('Home'));

        return strtr($html, [
            '<div class="breadcrumbs"></div>' => <<<HTML
                <div class="breadcrumbs">
                    <ul class="items" aria-hidden="true">
                        <li class="item home"><a href="#">$home</a></li>
                    </ul>
                </div>
            HTML,
        ]);
    }
}
