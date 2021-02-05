<?php

namespace Swissup\Breeze\Model\Filter;

class AbstractFilter
{
    /**
     * @param \Magento\Framework\View\LayoutInterface $layout
     */
    public function __construct(
        \Magento\Framework\View\LayoutInterface $layout
    ) {
        $this->layout = $layout;
    }

    /**
     * @param string $name
     */
    protected function addComponent($name)
    {
        if ($this->getJsBlock()) {
            $this->getJsBlock()->addItem($name);
        }
    }

    /**
     * @return \Swissup\Breeze\Block\Js
     */
    protected function getJsBlock()
    {
        return $this->layout->getBlock('breeze.js');
    }
}
