<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\Module\Dir;

class JsBuild
{
    /**
     * @var \Magento\Framework\View\Asset\Repository
     */
    private $assetRepo;

    /**
     * @var \Magento\Framework\View\Asset\File\FallbackContext
     */
    private $staticContext;

    /**
     * @var \Magento\Framework\Filesystem
     */
    private $filesystem;

    /**
     * @var \Magento\Framework\Filesystem\Directory\ReadInterface
     */
    private $staticDir;

    /**
     * @var \Magento\Framework\Filesystem\Directory\ReadFactory
     */
    private $readDirFactory;

    /**
     * @var \Magento\Framework\Module\Dir
     */
    private $moduleDir;

    /**
     * @var \Magento\Framework\Module\Manager
     */
    private $moduleManager;

    /**
     * @var \Magento\Framework\View\Asset\Minification
     */
    private $minification;

    /**
     * @var \Magento\Framework\Code\Minifier\AdapterInterface
     */
    private $minifier;

    /**
     * @var string
     */
    private $name;

    /**
     * @var array
     */
    private $items;

    /**
     * @param \Magento\Framework\View\Asset\Repository $assetRepo
     * @param \Magento\Framework\Filesystem $filesystem
     * @param \Magento\Framework\Filesystem\Directory\ReadFactory $readDirFactory
     * @param \Magento\Framework\Module\Manager $moduleManager
     * @param \Magento\Framework\View\Asset\Minification $minification
     * @param \Magento\Framework\Code\Minifier\AdapterInterface $minifier
     * @param Dir $moduleDir
     * @param string $name
     * @param array $items
     */
    public function __construct(
        \Magento\Framework\View\Asset\Repository $assetRepo,
        \Magento\Framework\Filesystem $filesystem,
        \Magento\Framework\Filesystem\Directory\ReadFactory $readDirFactory,
        \Magento\Framework\Module\Manager $moduleManager,
        \Magento\Framework\View\Asset\Minification $minification,
        \Magento\Framework\Code\Minifier\AdapterInterface $minifier,
        Dir $moduleDir,
        $name,
        array $items = []
    ) {
        $this->assetRepo = $assetRepo;
        $this->staticContext = $assetRepo->getStaticViewFileContext();
        $this->filesystem = $filesystem;
        $this->staticDir = $this->filesystem->getDirectoryRead(DirectoryList::STATIC_VIEW);
        $this->readDirFactory = $readDirFactory;
        $this->moduleDir = $moduleDir;
        $this->moduleManager = $moduleManager;
        $this->minification = $minification;
        $this->minifier = $minifier;
        $this->name = $name;
        $this->items = $items;
    }

    /**
     * @return \Magento\Framework\View\Asset\File
     */
    public function getAsset()
    {
        return $this->assetRepo->createArbitrary($this->getPath(), '');
    }

    /**
     * @return $this
     */
    public function publishIfNotExist()
    {
        if (!$this->staticDir->isExist($this->getPath())) {
            $this->publish();
        }

        return $this;
    }

    /**
     * @return string
     */
    private function getPath()
    {
        $suffix = '';
        $name = str_replace('::', '/', $this->name);

        if (strpos($name, '.js') === false) {
            $suffix = $this->minification->isEnabled('js') ? '.min.js' : '.js';
        }

        return $this->staticContext->getConfigPath() . '/' . $name . $suffix;
    }

    /**
     * @return $this
     */
    public function publish()
    {
        $build = [];
        $loadedDeps = [];

        foreach ($this->items as $name => $item) {
            $build[$name] = '';
            $path = $item;
            $deps = [];

            if (is_array($item)) {
                $path = $item['path'];
                $deps = $item['deps'] ?? [];
            }

            $deps = array_diff($deps, $loadedDeps);
            foreach ($deps as $depPath) {
                $build[$name] .= $this->getContents($depPath);
                $loadedDeps[$depPath] = $depPath;
            }

            $build[$name] .= $this->getContents($path);
        }

        $build = array_filter($build);
        $content = implode("\n", $build);

        if ($this->minification->isEnabled('js')) {
            $content = $this->minifier->minify($content);
        }

        $this->filesystem
            ->getDirectoryWrite(DirectoryList::STATIC_VIEW)
            ->writeFile($this->getPath(), $content);

        return $this;
    }

    /**
     * @param string $path
     * @return string
     */
    private function getContents($path)
    {
        $staticPath = $this->staticContext->getPath();
        $delimiter = strpos($path, '::') !== false ? '::' : '/';
        list($module, $relativePath) = explode($delimiter, $path, 2);

        if (strpos($relativePath, '.js') === false) {
            $relativePath .= '.js';
        }

        if (!$this->moduleManager->isEnabled($module)) {
            return '';
        }

        try {
            $modulePath = $this->moduleDir->getDir($module, Dir::MODULE_VIEW_DIR);
            $moduleDir = $this->readDirFactory->create($modulePath);
        } catch (\Exception $e) {
            return '';
        }

        foreach (['frontend/web/', 'base/web/'] as $area) {
            $fileContents = '';
            $filepath = $area . $relativePath;

            // try to read files from pub/static folder (minified and overriden by theme)
            $fullFilepaths = [];
            $fullFilepath = $staticPath . '/' . $module . '/' . str_replace($area, '', $filepath);
            if (strpos($fullFilepath, '.min.js') === false && $this->minification->isEnabled('js')) {
                $fullFilepaths[] = substr($fullFilepath, 0, -2) . 'min.js';
            }
            $fullFilepaths[] = $fullFilepath;

            foreach ($fullFilepaths as $fullFilepath) {
                if (!$this->staticDir->isExist($fullFilepath)) {
                    continue;
                }

                try {
                    $fileContents = $this->staticDir->readFile($fullFilepath);
                    break;
                } catch (\Exception $e) {
                    continue;
                }
            }

            // read directly from module sources
            if (!$fileContents) {
                try {
                    $fileContents = $moduleDir->readFile($filepath);
                } catch (\Exception $e) {
                    continue;
                }
            }

            return $fileContents;
        }

        return '';
    }
}
