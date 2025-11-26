<?php

namespace Swissup\Breeze\Model\RequireJs;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\App\State as AppState;
use Magento\Framework\Filesystem;
use Magento\Framework\RequireJs\Config;
use Magento\Framework\View\Asset\Repository as AssetRepository;

class FileManager
{
    private Config $config;

    private Filesystem $filesystem;

    private AppState $appState;

    private AssetRepository $assetRepo;

    public function __construct(
        Config $config,
        Filesystem $appFilesystem,
        AppState $appState,
        AssetRepository $assetRepo
    ) {
        $this->config = $config;
        $this->filesystem = $appFilesystem;
        $this->appState = $appState;
        $this->assetRepo = $assetRepo;
    }

    public function createRequireJsConfigAssetForBreeze(array $excludedModules = [])
    {
        if ($excludedModules) {
            // Config is a private class, so use closure to set excluded modules
            (function ($modules) {
                $this->fileSource->setExcludedModules($modules);
            })->bindTo($this->config, Config::class)($excludedModules);
        }

        $relPath = $this->config->getConfigFileRelativePath();
        $relPath = str_replace('requirejs-config', 'requirejs-config-breeze', $relPath);
        $this->ensureSourceFile($relPath);
        return $this->assetRepo->createArbitrary($relPath, '');
    }

    private function ensureSourceFile($relPath)
    {
        $dir = $this->filesystem->getDirectoryWrite(DirectoryList::STATIC_VIEW);
        if ($this->appState->getMode() == AppState::MODE_DEVELOPER || !$dir->isExist($relPath)) {
            $dir->writeFile($relPath, $this->config->getConfig());
        }
    }
}
