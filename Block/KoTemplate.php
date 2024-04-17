<?php

namespace Swissup\Breeze\Block;

use Magento\Framework\View\Element\Template;

class KoTemplate extends Template
{
    const WRAPPER = '<script type="text/html" id="%s">%s</script>';

    /**
     * @return string
     */
    protected function _toHtml()
    {
        return $this->prepareHtml(parent::_toHtml());
    }

    /**
     * @param string $html
     * @return string
     */
    protected function prepareHtml($html)
    {
        if (!$html) {
            return $html;
        }

        $html = str_replace("\n", ' ', $html);
        $html = preg_replace("/\s{2,}/", ' ', $html);

        if ($this->getData('wrapper') !== false) {
            $html = sprintf(self::WRAPPER, $this->getId(), $html);
            $html .= "\n";
        }

        return $html;
    }

    /**
     * @return string
     */
    protected function getId()
    {
        if ($this->hasData('id')) {
            return $this->getData('id');
        }

        $name = $this->getNameInLayout();

        // When block is anonymous make id = template path - Vendor_Module/popup.html
        if (strpos($name, 'breeze.container_schedule_') === 0) {
            $parts = ['breeze', str_replace('::', '/', $this->getTemplate())];
        } else {
            $parts = explode('.', $name);
        }

        return array_pop($parts);
    }
}
