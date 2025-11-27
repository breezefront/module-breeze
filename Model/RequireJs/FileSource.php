<?php

namespace Swissup\Breeze\Model\RequireJs;

use Magento\Framework\View\Design\ThemeInterface;

class FileSource extends \Magento\Framework\RequireJs\Config\File\Collector\Aggregated
{
    private array $excludedModules = [];

    private array $includedModules = [];

    private bool $onlyIncludedModules = false;

    public function setExcludedModules(array $modules): void
    {
        $this->excludedModules = $modules;
    }

    public function setIncludedModules(array $modules): void
    {
        $this->onlyIncludedModules = true;
        $this->includedModules = $modules;
    }

    public function getFiles(ThemeInterface $theme, $filePath)
    {
        $files = parent::getFiles($theme, $filePath);
        $ignoredVendors = [
            'Magento',
        ];

        foreach ($files as $key => $file) {
            $code = $file->getModule() ?: $file->getTheme()->getCode();
            if (!$code) {
                continue;
            }

            if (in_array($code, $this->excludedModules) ||
                $this->onlyIncludedModules && !in_array($code, $this->includedModules)
            ) {
                unset($files[$key]);
                continue;
            }

            foreach ($ignoredVendors as $vendor) {
                if (strpos($code, $vendor . '_') === 0) {
                    unset($files[$key]);
                    continue 2;
                }
            }
        }

        return $files;
    }
}
