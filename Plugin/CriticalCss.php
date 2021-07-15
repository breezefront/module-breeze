<?php

namespace Swissup\Breeze\Plugin;

class CriticalCss
{
    /**
     * @var \Swissup\Breeze\Helper\Data
     */
    private $helper;

    /**
     * @var \Magento\Framework\View\Asset\Repository
     */
    private $assetRepo;

    /**
     * @param \Swissup\Breeze\Helper\Data $helper
     * @param \Magento\Framework\View\Asset\Repository $assetRepo
     */
    public function __construct(
        \Swissup\Breeze\Helper\Data $helper,
        \Magento\Framework\View\Asset\Repository $assetRepo
    ) {
        $this->helper = $helper;
        $this->assetRepo = $assetRepo;
    }

    /**
     * @param \Magento\Theme\Block\Html\Header\CriticaCss $subject
     * @param string $result
     * @return string
     */
    public function afterGetCriticalCssData(
        $subject,
        $result
    ) {
        if (empty($result) || !$this->helper->isEnabled()) {
            return $result;
        }

        try {
            $content = $this->assetRepo
                ->createAsset('Swissup_Breeze::css/critical.css', [
                    '_secure' => 'false'
                ])
                ->getContent();

            $content = str_replace("\n", ' ', $content);
            $content = preg_replace('/\s\s+/', ' ', $content);
            $result = $content . $result;
        } catch (\Exception $e) {
            //
        }

        return $result;
    }
}
