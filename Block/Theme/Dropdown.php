<?php

namespace Swissup\Breeze\Block\Theme;

use Magento\Framework\View\Element\Template;

class Dropdown extends Template
{
    protected $_template = 'Swissup_Breeze::theme/dropdown.phtml';

    private $content;

    /**
     * @param Template\Context $context
     * @param array $data
     */
    public function __construct(
        Template\Context $context,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    protected function _toHtml()
    {
        if (!$this->getHref() && !$this->getChildHtml()) {
            return '';
        }

        return parent::_toHtml();
    }

    public function getCssClass(): string
    {
        $class = 'actions dropdown options switcher-options';

        if ($this->getData('chevron') === false || !$this->getChildHtml()) {
            $class .= ' no-chevron';
        }

        if ($this->getData('css_class')) {
            $class .= ' ' . $this->getData('css_class');
        }

        return $class;
    }
}
