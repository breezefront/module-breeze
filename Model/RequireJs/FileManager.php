<?php

namespace Swissup\Breeze\Model\RequireJs;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\App\State as AppState;
use Magento\Framework\Filesystem;
use Magento\Framework\RequireJs\ConfigFactory;
use Magento\Framework\View\Asset\Repository as AssetRepository;

class FileManager
{
    public function __construct(
        private ConfigFactory $configFactory,
        private FileSource $fileSource,
        private Filesystem $filesystem,
        private AppState $appState,
        private AssetRepository $assetRepo
    ) {
    }

    public function createRequireJsConfigExcluding(array $excludedModules = [])
    {
        if ($excludedModules) {
            $this->fileSource->setExcludedModules($excludedModules);
        }

        return $this->createAsset();
    }

    public function createRequireJsConfigIncluding(array $includedModules = [])
    {
        $this->fileSource->setIncludedModules($includedModules);

        return $this->createAsset();
    }

    private function createAsset()
    {
        $config = $this->configFactory->create(['fileSource' => $this->fileSource]);
        $relPath = $config->getConfigFileRelativePath();
        $relPath = str_replace('requirejs-config', 'requirejs-config-breeze', $relPath);

        $dir = $this->filesystem->getDirectoryWrite(DirectoryList::STATIC_VIEW);
        if ($this->appState->getMode() == AppState::MODE_DEVELOPER || !$dir->isExist($relPath)) {
            $dir->writeFile($relPath, $config->getConfig());
        }

        return $this->assetRepo->createArbitrary($relPath, '');
    }
}
