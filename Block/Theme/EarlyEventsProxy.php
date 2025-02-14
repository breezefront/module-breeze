<?php

namespace Swissup\Breeze\Block\Theme;

use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Template;

class EarlyEventsProxy extends Template
{
    protected $_template = 'Swissup_Breeze::theme/early-events-proxy.phtml';

    private Json $json;

    public function __construct(
        Template\Context $context,
        Json $json,
        array $data = []
    ) {
        $this->json = $json;

        parent::__construct($context, $data);
    }

    public function getRules(): string
    {
        $rules = [];

        foreach ($this->getData('rules') as $rule) {
            $rule['events'] = array_values($rule['events'] ?? []);
            $rules[] = $rule;
        }

        return $this->json->serialize($rules);
    }
}
