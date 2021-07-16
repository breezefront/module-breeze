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
        $additionalHandles = [
            'review_product_list' => [
                'breeze_catalog_product_view',
            ],
            'wishlist_index_configure' => [
                'breeze_catalog_product_view',
            ],
        ];

        foreach ($update->getHandles() as $handle) {
            if (strpos($handle, 'breeze_') === 0) {
                continue;
            }

            $update->addHandle('breeze_' . $handle);

            foreach ($additionalHandles[$handle] ?? [] as $handle) {
                $update->addHandle($handle);
            }
        }

        $update->addHandle('breeze');
    }
}
