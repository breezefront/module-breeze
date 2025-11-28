<?php

namespace Swissup\Breeze\Block\Theme;

use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Template;

class ScrollReveal extends Template
{
    protected $_template = 'Swissup_Breeze::theme/scroll-reveal.phtml';

    public function __construct(
        Template\Context $context,
        private Json $json,
        array $data = []
    ) {
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

    public function getCssSelector($prefix = '.js '): string
    {
        $selectors = explode(',', implode(',', $this->getSelectors())); // explode on each comma
        $selectors = $prefix . implode(', ' . $prefix, $selectors);
        return $selectors;
    }

    public function getCssSelectorForActiveKeyboard(): string
    {
        return $this->getCssSelector('.js.kbd ');
    }

    public function getJsSelector(): string
    {
        return $this->json->serialize(implode(',', $this->getSelectors()));
    }
}
