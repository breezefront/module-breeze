<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\View\Asset\File;

class JsAsset
{
    private File $asset;

    private array $bundleInfo;

    public function __construct(File $asset, array $bundleInfo)
    {
        $this->asset = $asset;
        $this->bundleInfo = $bundleInfo;
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
