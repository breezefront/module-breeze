<?php

namespace Swissup\Breeze\Block;

use Magento\Framework\View\Element\Template;

class HtmlTemplate extends KoTemplate
{
    public function __construct(
        Template\Context $context,
        private \Magento\Framework\Filesystem\Driver\File $file,
        array $data = []
    ) {
        parent::__construct($context, $data);
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
