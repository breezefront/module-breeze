<?php

namespace Swissup\Breeze\Observer;

use Magento\Framework\Event\ObserverInterface;

class LayoutLoadBefore implements ObserverInterface
{
    private $helper;

    private $pageConfig;

    public function __construct(
        \Swissup\Breeze\Helper\Data $helper,
        \Magento\Framework\View\Page\Config $pageConfig
    ) {
        $this->helper = $helper;
        $this->pageConfig = $pageConfig;
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

        $this->pageConfig->addBodyClass('breeze');

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
