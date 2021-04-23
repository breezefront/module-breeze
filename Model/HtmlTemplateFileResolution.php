<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\View\Design\FileResolution\Fallback\TemplateFile;
use Magento\Framework\View\Design\FileResolution\Fallback\ResolverInterface;
use Magento\Framework\View\Design\ThemeInterface;

class HtmlTemplateFileResolution extends TemplateFile
{
    /**
     * @var ResolverInterface
     */
    private $resolver;

    /**
     * Constructor
     *
     * @param ResolverInterface $resolver
     */
    public function __construct(ResolverInterface $resolver)
    {
        $this->resolver = $resolver;
    }

    /**
     * Get existing file name, using fallback mechanism
     *
     * @param string $area
     * @param ThemeInterface $themeModel
     * @param string $file
     * @param string|null $module
     * @return string|bool
     */
    public function getFile($area, ThemeInterface $themeModel, $file, $module = null)
    {
        return $this->resolver->resolve($this->getFallbackType(), $file, $area, $themeModel, null, $module);
    }

    /**
     * @return string
     */
    protected function getFallbackType()
    {
        return \Swissup\Breeze\Model\HtmlTemplateFileResolutionRulePool::TYPE_HTML_TEMPLATE_FILE;
    }
}
