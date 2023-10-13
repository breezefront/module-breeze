<?php

namespace Swissup\Breeze\Model\System\Message;

use Magento\Framework\Notification\MessageInterface;

class Performance implements MessageInterface
{
    /**
     * @var \Magento\Backend\Model\UrlInterface
     */
    private $urlBuilder;

    /**
     * @var \Magento\Framework\FlagManager
     */
    private $flagManager;
    
    /**
     * @var \Magento\Framework\App\Config\ScopeConfigInterface
     */
    private $scopeConfig;

    public function __construct(
        \Magento\Backend\Model\UrlInterface $urlBuilder,
        \Magento\Framework\FlagManager $flagManager,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
    ) {
        $this->urlBuilder = $urlBuilder;
        $this->flagManager = $flagManager;
        $this->scopeConfig = $scopeConfig;
    }

    /**
     * @return string
     */
    public function getIdentity()
    {
        return 'swissup_breeze_performance';
    }

    /**
     * @return bool
     */
    public function isDisplayed()
    {
        return $this->isDismissed() && !$this->checkConfigs();
    }
    
    private function checkConfigs() 
    {
        $configs = [
            'dev/template/minify_html' => true,
            'dev/js/merge_files' => true,
            'dev/js/enable_js_bundling' => false,
            'dev/js/minify_files' => true,
            'dev/js/move_script_to_bottom' => true,
            'dev/css/merge_css_files' => true,
            'dev/css/minify_files' => true,
            'dev/css/use_css_critical_path' => true,
        ];
        //$scope = \Magento\Store\Model\ScopeInterface::SCOPE_STORE;
        $result = true;
        foreach($configs as $path => $correctValue) {
            $value = $this->scopeConfig->isSetFlag($path/*, $scope*/);
            $result = $result && $value === $correctValue;
            if (!$result) {
                break;
            }
        }
        
        return $result;
    }

    /**
     * @return bool
     */
    private function isDismissed()
    {
        $flag = 'swissup_breeze_dismissed_messages';
        $dismissedMessages = $this->flagManager->getFlagData($flag) ?? [];
        return !in_array($this->getIdentity(), $dismissedMessages);
    }

    /**
     * @return string
     */
    public function getText()
    {
        $message = __(
            '<b>Swissup Breeze:</b> '
        );        
        $message .= __(
            "Breeze Warning: Your store's page speed settings are not optimized. When your store is ready to sell, optimize Magento settings and enable production mode." 
            . 'Click <a href="%1" target="_blank" rel="noopener noreferer">here</a> for detailed instructions. ', 
            'https://breezefront.com/docs/performance'
        );
        $dismissUrl = $this->urlBuilder->getUrl(
            'adminhtml/system_messages/dismiss', 
            ['message_code' => $this->getIdentity()]
        );
        $message .= __('<a href="%1">Dismiss message</a>.', $dismissUrl);
        return $message;
    }

    /**
     * @return int
     */
    public function getSeverity()
    {
        return MessageInterface::SEVERITY_MINOR;
    }
}
