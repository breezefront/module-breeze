<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\View\Asset\File;

class JsAsset
{
    public function __construct(
        private File $asset,
        private array $bundleInfo
    ) {
    }

    public function getAsset()
    {
        return $this->asset;
    }

    public function getType()
    {
        return $this->bundleInfo['type'];
    }

    public function getUrl()
    {
        return $this->asset->getUrl();
    }
}
