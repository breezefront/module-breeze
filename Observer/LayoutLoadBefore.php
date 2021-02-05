<?php

namespace Swissup\Breeze\Observer;

use Magento\Framework\Event\ObserverInterface;

class LayoutLoadBefore implements ObserverInterface
{
    protected $helper;

    public function __construct(
        \Swissup\Breeze\Helper\Data $helper
    ) {
        $this->helper = $helper;
    }

    /**
     * @param \Magento\Framework\Event\Observer $observer
     * @return void
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        if (!$this->helper->isEnabled()) {
            return;
        }

        $update = $observer->getLayout()->getUpdate();

        foreach ($update->getHandles() as $handle) {
            $update->addHandle('breeze_' . $handle);
        }

        $update->addHandle('breeze');
    }
}
