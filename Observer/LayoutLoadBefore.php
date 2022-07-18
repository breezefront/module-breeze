<?php

namespace Swissup\Breeze\Observer;

use Magento\Framework\Event\ObserverInterface;

class LayoutLoadBefore implements ObserverInterface
{
    private $helper;

    private $pageConfig;

    private $customerSession;

    private $design;

    public function __construct(
        \Swissup\Breeze\Helper\Data $helper,
        \Magento\Framework\View\Page\Config $pageConfig,
        \Magento\Customer\Model\Session $customerSession,
        \Magento\Framework\View\DesignInterface $design
    ) {
        $this->helper = $helper;
        $this->pageConfig = $pageConfig;
        $this->customerSession = $customerSession;
        $this->design = $design;
    }

    /**
     * @param \Magento\Framework\Event\Observer $observer
     * @return void
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        $update = $observer->getLayout()->getUpdate();

        // Add additional handles for breeze theme
        if ($this->customerSession->isLoggedIn()) {
            $update->addHandle('customer_logged_in');
        } else {
            $update->addHandle('customer_logged_out');
        }

        if (!$this->helper->isEnabled()) {
            return;
        }

        $this->pageConfig->addBodyClass('breeze');

        foreach ($update->getHandles() as $handle) {
            if (strpos($handle, 'breeze_') === 0) {
                continue;
            }

            $update->addHandle('breeze_' . $handle);
        }

        $baseTheme = $this->design->getDesignTheme()->getInheritedThemes()[0];
        if ($baseTheme->getCode() === 'Swissup/breeze-blank') {
            $update->addHandle('breeze_theme');
        }

        $update->addHandle('breeze');
    }
}
