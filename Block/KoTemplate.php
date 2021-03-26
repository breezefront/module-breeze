<?php

namespace Swissup\Breeze\Block;

use Magento\Framework\View\Element\Template;

class KoTemplate extends Template
{
    const WRAPPER = '<script type="text/html" id="%s" data-breeze>%s</script>';

    /**
     * @return string
     */
    protected function _toHtml()
    {
        $html = parent::_toHtml();

        if ($html) {
            $html = preg_replace("/\s{2,}/", ' ', $html);
            $html = sprintf(self::WRAPPER, $this->getId(), $html);
            $html .= "\n";
        }

        return $html;
    }

    protected function getId()
    {
        if ($this->hasData('id')) {
            return $this->getData('id');
        }

        $parts = explode('.', $this->getNameInLayout());

        return array_pop($parts);
    }
}
