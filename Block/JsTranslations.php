<?php

namespace Swissup\Breeze\Block;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Translation\Model\Js\Config;

class JsTranslations extends \Magento\Framework\View\Element\AbstractBlock
{
    const TEMPLATE = '<script>var translations = %s</script>';

    public function __construct(
        private \Magento\Framework\View\Element\Context $context,
        private \Magento\Translation\Model\FileManager $fileManager,
        private \Magento\Framework\Filesystem\Driver\File $file,
        private \Magento\Framework\HTTP\Adapter\CurlFactory $curlFactory,
        private DirectoryList $directoryList,
        private Config $config,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    /**
     * @return string
     */
    protected function _toHtml()
    {
        if (!$this->config->dictionaryEnabled()) {
            return '';
        }

        $translations = $this->getTranslations();
        if (!$translations) {
            return '';
        }

        return sprintf(
            self::TEMPLATE,
            json_encode($translations)
        );
    }

    /**
     * Try to get js translations from dictionary file.
     * If file is not exists, make curl request to its url.
     *
     * @return mixed
     */
    private function getTranslations()
    {
        $path = $this->getDictionaryFullPath();

        if ($this->file->isExists($path)) {
            try {
                $data = $this->file->fileGetContents($path);
            } catch (\Exception $e) {
                return false;
            }
        } else {
            $curl = $this->curlFactory->create()->setConfig([
                'header' => false,
                'verifypeer' => false,
                'verifyhost' => 0,
            ]);
            $curl->write('GET', $this->getDictionaryUrl());

            $data = $curl->read();
            $responseCode = (int) $curl->getInfo(CURLINFO_HTTP_CODE);

            $curl->close();

            if ($responseCode !== 200) {
                return false;
            }
        }

        if (!$data) {
            return false;
        }

        return json_decode($data, true);
    }

    /**
     * @return string
     */
    private function getDictionaryFullPath()
    {
        return $this->directoryList->getPath(DirectoryList::STATIC_VIEW)
            . '/'
            . $this->getDictionaryPath();
    }

    /**
     * @return string
     */
    private function getDictionaryPath()
    {
        return $this->fileManager->getTranslationFilePath()
            . '/'
            . Config::DICTIONARY_FILE_NAME;
    }

    /**
     * @return string
     */
    private function getDictionaryUrl()
    {
        return $this->_assetRepo->getUrl(Config::DICTIONARY_FILE_NAME);
    }

    /**
     * Get Key pieces for caching block content
     *
     * @return array
     */
    public function getCacheKeyInfo()
    {
        return [
            $this->fileManager->getTranslationFileVersion(),
        ];
    }
}
