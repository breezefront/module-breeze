<?php

namespace Swissup\Breeze\Plugin;

use Magento\Framework\App\ResponseInterface;
use Magento\Framework\Controller\ResultInterface;

class ViewResultPage
{
    public function __construct(
        protected \Swissup\Breeze\Helper\Data $helper,
        protected \Swissup\Breeze\Model\Filter $filter
    ) {
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
        if (empty($html) || strpos($html, '<html') === false) {
            return $result;
        }

        $html = $this->filter->process($html);
        $httpResponse->setBody($html);

        return $result;
    }
}
