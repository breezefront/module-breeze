<?php

namespace Swissup\Breeze\Block;

use Magento\Framework\View\Element\Template;

class HtmlTemplate extends KoTemplate
{
    private \Magento\Framework\Filesystem\Driver\File $file;

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
            $template = $this->getTemplateFile();
            $html = $template ? $this->file->fileGetContents($template) : '';
        } catch (\Exception $e) {
            $html = '';
        }

        return $this->prepareHtml($html);
    }
}
