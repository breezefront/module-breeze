<?php

namespace Swissup\Breeze\Block\Theme;

use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Template;

class ScrollReveal extends Template
{
    protected $_template = 'Swissup_Breeze::theme/scroll-reveal.phtml';

    private Json $json;

    public function __construct(
        Template\Context $context,
        Json $json,
        array $data = []
    ) {
        $this->json = $json;

        parent::__construct($context, $data);
    }

    public function getTemplate()
    {
        if ($this->getEnabled() !== true) {
            return '';
        }
        return parent::getTemplate();
    }

    protected function _prepareLayout()
    {
        if ($this->getEnabled() === true) {
            $this->pageConfig->addBodyClass('scroll-reveal-enabled');
        }
        return parent::_prepareLayout();
    }

    public function getSelectors()
    {
        return array_filter($this->getData('selectors'));
    }

    public function getCssSelector(): string
    {
        $selectors = explode(',', implode(',', $this->getSelectors())); // explode on each comma
        $selectors = '.js ' . implode(', .js ', $selectors);
        return $selectors;
    }

    public function getJsSelector(): string
    {
        return $this->json->serialize(implode(',', $this->getSelectors()));
    }
}
