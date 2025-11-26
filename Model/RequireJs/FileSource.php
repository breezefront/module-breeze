<?php

namespace Swissup\Breeze\Model\RequireJs;

use Magento\Framework\View\Design\ThemeInterface;

class FileSource extends \Magento\Framework\RequireJs\Config\File\Collector\Aggregated
{
    private array $excludedModules = [];

    public function setExcludedModules(array $modules): void
    {
        $this->excludedModules = $modules;
    }

    public function getFiles(ThemeInterface $theme, $filePath)
    {
        $files = parent::getFiles($theme, $filePath);
        $ignoredVendors = [
            'Magento',
        ];

        foreach ($files as $key => $file) {
            if (!$module = $file->getModule()) {
                continue;
            }

            if (in_array($module, $this->excludedModules)) {
                unset($files[$key]);
                continue;
            }

            foreach ($ignoredVendors as $vendor) {
                if (strpos($module, $vendor . '_') === 0) {
                    unset($files[$key]);
                    continue 2;
                }
            }
        }

        return $files;
    }
}
