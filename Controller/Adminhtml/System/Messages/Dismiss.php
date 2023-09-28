<?php

namespace Swissup\Breeze\Controller\Adminhtml\System\Messages;

use Magento\Backend\App\Action;
use Magento\Framework\FlagManager;

/**
 * Class Dismiss
 */
class Dismiss extends Action
{
    /**
     * @var FlagManager
     */
    private $flagManager;

    public function __construct(
        Action\Context $context,
        FlagManager $flagManager
    ) {
        parent::__construct($context);
        $this->flagManager = $flagManager;
    }

    /**
     * @return \Magento\Framework\App\ResponseInterface
     */
    public function execute()
    {
        $flag = 'swissup_breeze_dismissed_messages';
        $dismissedMessages = $this->flagManager->getFlagData($flag) ?? [];        
        array_push($dismissedMessages, $this->getRequest()->getParam('message_code'));
        $this->flagManager->saveFlag($flag, array_unique($dismissedMessages));

        return $this->_redirect($this->_redirect->getRefererUrl());
    }
}
