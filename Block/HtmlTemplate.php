<?php

namespace Swissup\Breeze\Block;

use Magento\Framework\View\Element\Template;

class HtmlTemplate extends KoTemplate
{
    /**
     * @var \Magento\Framework\Filesystem\Driver\File
     */
    private $file;

    /**
     * @param Template\Context $context
     * @param \Magento\Framework\Filesystem\Driver\File $file
     * @param array $data
     */
    public function __construct(
        Template\Context $context,
        \Magento\Framework\Filesystem\Driver\File $file,
        array $data = []
    ) {
        parent::__construct($context, $data);

        $this->file = $file;
    }

    /**
     * @return string
     */
    protected function _toHtml()
    {
        try {
            $html = $this->file->fileGetContents($this->getTemplateFile());
        } catch (\Exception $e) {
            $html = '';
        }

        return $this->prepareHtml($html);
    }
}
