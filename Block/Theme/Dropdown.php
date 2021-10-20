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
        if (!$this->getData('url') && !$this->getContent()) {
            return '';
        }

        return parent::_toHtml();
    }

    public function getContent()
    {
        if ($this->content !== null) {
            return $this->content;
        }

        $content = $this->getData('content');

        if (strpos($content, 'block::') === 0) {
            $block = str_replace('block::', '', $content);
            $block = $this->getLayout()->getBlock($block);
            $content = $block ? $block->toHtml() : '';
        }

        return $content;
    }
}
