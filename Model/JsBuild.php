<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\Component\ComponentRegistrar;
use Magento\Framework\Module\Dir;

class JsBuild
{
    private \Magento\Framework\View\Asset\Repository $assetRepo;

    private \Magento\Framework\View\Asset\File\FallbackContext $staticContext;

    private \Magento\Framework\Filesystem $filesystem;

    private \Magento\Framework\Filesystem\Directory\WriteInterface $staticDir;

    private \Magento\Framework\Filesystem\Directory\ReadFactory $readDirFactory;

    private \Magento\Framework\Module\Dir $moduleDir;

    private \Magento\Framework\Module\Manager $moduleManager;

    private \Magento\Framework\View\Asset\Minification $minification;

    private \Magento\Framework\Code\Minifier\AdapterInterface $minifier;

    private \Magento\Framework\HTTP\Adapter\CurlFactory $curlFactory;

    private \Magento\Framework\View\DesignInterface $design;

    private \Magento\Framework\Component\ComponentRegistrar $componentRegistrar;

    private string $name;

    private array $items;

    private array $assets = [];

    public function __construct(
        \Magento\Framework\View\Asset\Repository $assetRepo,
        \Magento\Framework\Filesystem $filesystem,
        \Magento\Framework\Filesystem\Directory\ReadFactory $readDirFactory,
        \Magento\Framework\Module\Manager $moduleManager,
        \Magento\Framework\View\Asset\Minification $minification,
        \Magento\Framework\Code\Minifier\AdapterInterface $minifier,
        \Magento\Framework\View\DesignInterface $design,
        \Magento\Framework\HTTP\Adapter\CurlFactory $curlFactory,
        ComponentRegistrar $componentRegistrar,
        Dir $moduleDir,
        $name,
        array $items = []
    ) {
        $this->assetRepo = $assetRepo;
        $this->staticContext = $assetRepo->getStaticViewFileContext();
        $this->filesystem = $filesystem;
        $this->staticDir = $this->filesystem->getDirectoryWrite(DirectoryList::STATIC_VIEW);
        $this->readDirFactory = $readDirFactory;
        $this->design = $design;
        $this->componentRegistrar = $componentRegistrar;
        $this->moduleDir = $moduleDir;
        $this->moduleManager = $moduleManager;
        $this->minification = $minification;
        $this->minifier = $minifier;
        $this->curlFactory = $curlFactory;
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
    public function publishIfNotExist()
    {
        if (!$this->staticDir->isExist($this->getPath()) ||
            !$this->versionMatches()
        ) {
            $this->publish();
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
    public function publish()
    {
        if (!$this->staticDir->isWritable()) {
            return $this;
        }

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
            $itemSize = mb_strlen($item) / 1024;
            $isLast = !isset($build[$i + 1]);

            if ($size > 20 && $size + $itemSize > 80 && (!$isLast || $itemSize > 10)) {
                $num++;
                $size = 0;
            }

            $chunks[$num][] = $item;
            $size += $itemSize;
        }

        foreach ($chunks as $i => $build) {
            $content = implode("\n", $build);

            if ($this->minification->isEnabled('js')) {
                $content = $this->minifier->minify($content);
            }

            $path = $this->getPath($i);
            $this->staticDir->writeFile($path, $content);
            $this->assets[] = $this->assetRepo->createArbitrary($path, '');
        }

        $this->publishVersion();

        return $this;
    }

    private function getVersion()
    {
        return implode(',', array_keys($this->items));
    }

    private function versionMatches()
    {
        $deployedVersion = (string) $this->readFileFromPubStatic($this->getPathToVersionFile());
        $deployedVersion = trim($deployedVersion);

        return strcmp($deployedVersion, $this->getVersion()) === 0;
    }

    private function publishVersion()
    {
        $this->staticDir->writeFile(
            $this->staticContext->getConfigPath() . '/' . $this->getPathToVersionFile(),
            $this->getVersion()
        );
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
        if (!$path) {
            return '';
        }

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
            if (!$this->staticDir->isExist($fullFilepath)) {
                try {
                    return $this->deployAndRead($fullFilepath);
                } catch (\Exception $e) {
                    continue;
                }
            }

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

    private function deployAndRead($path)
    {
        $path = str_replace($this->staticContext->getPath(), '', $path);
        $path = trim($path, '/');
        $url = $this->assetRepo->getUrl($path);

        $curl = $this->curlFactory->create()->setConfig([
            'header' => false,
            'verifypeer' => false,
        ]);
        $curl->write('GET', $url);

        $data = $curl->read();
        $responseCode = (int) $curl->getInfo(CURLINFO_HTTP_CODE);

        $curl->close();

        if ($responseCode !== 200) {
            throw new \Exception('Unable to read ' . $url);
        }

        return $data;
    }
}
