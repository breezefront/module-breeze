<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\Component\ComponentRegistrar;
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
     * @var \Magento\Framework\View\DesignInterface
     */
    private $design;

    /**
     * @var ComponentRegistrar $componentRegistrar
     */
    private $componentRegistrar;

    /**
     * @var string
     */
    private $name;

    /**
     * @var array
     */
    private $items;

    /**
     * @var array
     */
    private $assets = [];

    /**
     * @param \Magento\Framework\View\Asset\Repository $assetRepo
     * @param \Magento\Framework\Filesystem $filesystem
     * @param \Magento\Framework\Filesystem\Directory\ReadFactory $readDirFactory
     * @param \Magento\Framework\Module\Manager $moduleManager
     * @param \Magento\Framework\View\Asset\Minification $minification
     * @param \Magento\Framework\Code\Minifier\AdapterInterface $minifier
     * @param \Magento\Framework\View\DesignInterface $design
     * @param ComponentRegistrar $componentRegistrar
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
        \Magento\Framework\View\DesignInterface $design,
        ComponentRegistrar $componentRegistrar,
        Dir $moduleDir,
        $name,
        array $items = []
    ) {
        $this->assetRepo = $assetRepo;
        $this->staticContext = $assetRepo->getStaticViewFileContext();
        $this->filesystem = $filesystem;
        $this->staticDir = $this->filesystem->getDirectoryRead(DirectoryList::STATIC_VIEW);
        $this->readDirFactory = $readDirFactory;
        $this->design = $design;
        $this->componentRegistrar = $componentRegistrar;
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
     * @return \Magento\Framework\View\Asset\File[]
     */
    public function getBundledAssets()
    {
        if ($this->assets) {
            return $this->assets;
        }

        $pathinfo = pathinfo($this->getPath());
        $file = str_replace('.min', '', $pathinfo['filename']);
        $dir = $pathinfo['dirname'];

        $paths = $this->staticDir->read($dir);
        sort($paths, SORT_NATURAL);

        foreach ($paths as $path) {
            if (strpos($path, '.js') === false) {
                continue;
            }

            if (!preg_match("/{$file}(\d+|\.)/", $path)) {
                continue;
            }

            $this->assets[] = $this->assetRepo->createArbitrary($path, '');
        }

        return $this->assets;
    }

    /**
     * @return $this
     */
    public function publishIfNotExist($version)
    {
        if (!$this->staticDir->isExist($this->getPath()) || !$this->versionMatches($version)) {
            $this->publish($version);
        }

        return $this;
    }

    /**
     * @return string
     */
    private function getPath($chunk = 0)
    {
        $suffix = '';
        $name = str_replace('::', '/', $this->name);

        if (strpos($name, '.js') === false) {
            $suffix = $this->minification->isEnabled('js') ? '.min.js' : '.js';
        }

        $name .= $suffix;

        if ($chunk) {
            $extension = strpos($name, '.min.js') !== false ? '.min.js' : '.js';
            $name = str_replace($extension, $chunk . $extension, $name);
        }

        return $this->staticContext->getConfigPath() . '/' . $name;
    }

    /**
     * @return $this
     */
    public function publish($version = null)
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
                $deps += $item['import'] ?? [];
            }

            $deps = array_diff($deps, $loadedDeps);
            foreach ($deps as $key => $depPath) {
                if (strpos($key, '::') !== false) {
                    continue;
                }

                $build[$name] .= $this->getContents($depPath);
                $loadedDeps[$depPath] = $depPath;
            }

            if (isset($loadedDeps[$path])) {
                continue;
            }

            $build[$name] .= $this->getContents($path);
        }

        $build = array_values(array_filter($build));

        $num = 0;
        $size = 0;
        $chunks = [];
        foreach ($build as $i => $item) {
            $currentSize = mb_strlen($item) / 1024;
            $isLast = !isset($build[$i + 1]);

            if ($size && $size + $currentSize > 80 && (!$isLast || $currentSize > 5)) {
                $num++;
                $size = 0;
            }

            $chunks[$num][] = $item;
            $size += $currentSize;
        }

        foreach ($chunks as $i => $build) {
            $content = implode("\n", $build);

            if ($this->minification->isEnabled('js')) {
                $content = $this->minifier->minify($content);
            }

            $path = $this->getPath($i);
            $this->filesystem
                ->getDirectoryWrite(DirectoryList::STATIC_VIEW)
                ->writeFile($path, $content);

            $this->assets[] = $this->assetRepo->createArbitrary($path, '');
        }

        if ($version) {
            $this->publishVersion($version);
        }

        return $this;
    }

    private function versionMatches($hash)
    {
        $deployedVersion = (string) $this->readFileFromPubStatic($this->getPathToVersionFile());
        $deployedVersion = trim($deployedVersion);

        return strcmp($deployedVersion, $hash) === 0;
    }

    private function publishVersion($hash)
    {
        $this->filesystem
            ->getDirectoryWrite(DirectoryList::STATIC_VIEW)
            ->writeFile($this->staticContext->getConfigPath() . '/' . $this->getPathToVersionFile(), $hash);
    }

    private function getPathToVersionFile()
    {
        $path = str_replace('::', '/', $this->name);
        $path = str_replace(['.min.js', '.js'], '', $path);

        return $path . '.txt';
    }

    /**
     * @param string $path
     * @return string
     */
    private function getContents($path)
    {
        list($module, $relativePath) = $this->extractModuleAndPath($path);

        if ($module) {
            $contents = $this->readFileFromModule($module, $relativePath);
        } else {
            $contents = $this->readFileFromTheme($relativePath);
        }

        return $contents;
    }

    /**
     * @param string $path
     * @return string
     */
    private function readFileFromTheme($path)
    {
        $contents = $this->readFileFromPubStatic($path);
        if ($contents !== false) {
            return $contents;
        }

        try {
            $dir = $this->componentRegistrar->getPath(
                ComponentRegistrar::THEME,
                $this->design->getDesignTheme()->getFullPath()
            );
            $dir = $this->readDirFactory->create($dir);
        } catch (\Exception $e) {
            return '';
        }

        try {
            return $dir->readFile('web/' . $path);
        } catch (\Exception $e) {
            return '';
        }
    }

    /**
     * @param string $module
     * @param string $path
     * @return string
     */
    private function readFileFromModule($module, $path)
    {
        if (!$this->moduleManager->isEnabled($module)) {
            return '';
        }

        $contents = $this->readFileFromPubStatic($module . '/' . $path);
        if ($contents !== false) {
            return $contents;
        }

        try {
            $dir = $this->moduleDir->getDir($module, Dir::MODULE_VIEW_DIR);
            $dir = $this->readDirFactory->create($dir);
        } catch (\Exception $e) {
            return '';
        }

        // read directly from module sources
        foreach (['frontend/web/', 'base/web/'] as $area) {
            try {
                return $dir->readFile($area . $path);
            } catch (\Exception $e) {
                continue;
            }
        }

        return '';
    }

    /**
     * @param string $path
     * @return string|false
     */
    private function readFileFromPubStatic($path)
    {
        $staticPath = $this->staticContext->getPath();

        $fullFilepaths = [];
        $fullFilepath = $staticPath . '/' . $path;
        if (strpos($fullFilepath, '.min.js') === false &&
            strpos($fullFilepath, '.txt') === false &&
            $this->minification->isEnabled('js')
        ) {
            $fullFilepaths[] = substr($fullFilepath, 0, -2) . 'min.js';
        }

        $fullFilepaths[] = $fullFilepath;

        foreach ($fullFilepaths as $fullFilepath) {
            try {
                return $this->staticDir->readFile($fullFilepath);
            } catch (\Exception $e) {
                continue;
            }
        }

        return false;
    }

    /**
     * @param string $path
     * @return array
     */
    private function extractModuleAndPath($path)
    {
        $delimiter = strpos($path, '::') !== false ? '::' : '/';

        list($module, $relativePath) = explode($delimiter, $path, 2);

        if (strpos($module, '_') === false) {
            $module = false;
            $relativePath = $path;
        }

        if (strpos($relativePath, '.js') === false) {
            $relativePath .= '.js';
        }

        return [
            $module,
            $relativePath
        ];
    }
}
