<?php

namespace Swissup\Breeze\Plugin;

use Magento\Framework\App\ResponseInterface;
use Magento\Framework\Controller\ResultInterface;

class ViewResultPage
{
    /**
     * @var \Swissup\Breeze\Helper\Data
     */
    protected $helper;

    /**
     * @var \Swissup\Breeze\Model\Filter
     */
    protected $filter;

    /**
     * @param \Swissup\Breeze\Helper\Data $helper
     * @param \Swissup\Breeze\Model\Filter $filter
     */
    public function __construct(
        \Swissup\Breeze\Helper\Data $helper,
        \Swissup\Breeze\Model\Filter $filter
    ) {
        $this->helper = $helper;
        $this->filter = $filter;
    }

    /**
     * Convert html to amphtml
     *
     * @param ResultInterface $subject
     * @param ResultInterface $result
     * @param ResponseInterface $httpResponse
     * @return ResultInterface
     */
    public function afterRenderResult(
        ResultInterface $subject,
        ResultInterface $result,
        ResponseInterface $httpResponse
    ) {
        if (!$this->helper->isEnabled()) {
            return $result;
        }

        $html = $httpResponse->getBody();
        if (empty($html)) {
            return $result;
        }

        $html = $this->filter->process($html);
        $httpResponse->setBody($html);

        return $result;
    }
}
