<?php

namespace Swissup\Breeze\Observer;

use Magento\Framework\Event\ObserverInterface;

class LayoutLoadBefore implements ObserverInterface
{
    public function __construct(
        private \Swissup\Breeze\Helper\Data $helper,
        private \Magento\Framework\View\Page\Config $pageConfig,
        private \Magento\Customer\Model\Session $customerSession,
        private \Magento\Framework\View\DesignInterface $design,
        private \Magento\Framework\View\EntitySpecificHandlesList $entitySpecificHandlesList
    ) {
    }

    /**
     * @param \Magento\Framework\Event\Observer $observer
     * @return void
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        $update = $observer->getLayout()->getUpdate();
        $handles = $update->getHandles();
        if (array_intersect($handles, ['breeze_customer_logged_in', 'breeze_customer_logged_out'])) {
            return;
        }

        // Add additional handles for breeze theme
        if ($this->customerSession->isLoggedIn()) {
            $update->addHandle('breeze_customer_logged_in');
        } else {
            $update->addHandle('breeze_customer_logged_out');
        }

        if (!$this->helper->isEnabled()) {
            return;
        }

        $this->pageConfig->addBodyClass('breeze');

        $entitySpecificHandles = $this->entitySpecificHandlesList->getHandles();
        foreach ($update->getHandles() as $handle) {
            if (strpos($handle, 'breeze_') === 0) {
                continue;
            }

            $update->addHandle('breeze_' . $handle);

            if (in_array($handle, $entitySpecificHandles)) {
                $this->entitySpecificHandlesList->addHandle('breeze_' . $handle);
            }
        }

        $baseTheme = $this->design->getDesignTheme()->getInheritedThemes()[0];
        if ($baseTheme->getCode() === 'Swissup/breeze-blank') {
            $update->addHandle('breeze_theme');
        }

        $update->addHandle('breeze');
    }
}
