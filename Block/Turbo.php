<?php

namespace Swissup\Breeze\Block;

use Magento\Framework\View\Element\Template;

class Turbo extends Template
{
    protected $_template = 'Swissup_Breeze::turbo.phtml';

    /**
     * @var \Magento\Framework\Serialize\Serializer\Json
     */
    private $serializer;

    /**
     * @var \Swissup\Breeze\Helper\Data
     */
    private $helper;

    /**
     * @param Template\Context $context
     * @param array $data
     */
    public function __construct(
        Template\Context $context,
        \Magento\Framework\Serialize\Serializer\Json $serializer,
        \Swissup\Breeze\Helper\Data $helper,
        array $data = []
    ) {
        $this->serializer = $serializer;
        $this->helper = $helper;

        parent::__construct($context, $data);
    }

    /**
     * @return string
     */
    public function getJsonConfig()
    {
        return $this->serializer->serialize([
            'excludedUrls' => $this->helper->getExcludedUrls(),
            'store' => $this->_storeManager->getStore()->getCode(),
        ]);
    }
}
