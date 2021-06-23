<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\View\Design\Fallback\Rule;
use Magento\Framework\View\Design\Fallback\Rule\Composite;
use Magento\Framework\View\Design\Fallback\Rule\RuleInterface;

class HtmlTemplateFileResolutionRulePool extends \Magento\Framework\View\Design\Fallback\RulePool
{
    const TYPE_HTML_TEMPLATE_FILE = 'html_template';

    /**
     * Rules
     *
     * @var array
     */
    private $rules = [];

    /**
     * Factory for simple rule
     *
     * @var \Magento\Framework\View\Design\Fallback\Rule\SimpleFactory
     */
    private $simpleFactory;

    /**
     * Factory for theme rule
     *
     * @var Rule\ThemeFactory
     */
    private $themeFactory;

    /**
     * Factory for modular switcher
     *
     * @var Rule\ModularSwitchFactory
     */
    private $modularSwitchFactory;

    /**
     * Factory for module rule
     *
     * @var Rule\ModuleFactory
     */
    private $moduleFactory;

    /**
     * Constructor
     *
     * @param \Magento\Framework\Filesystem $filesystem
     * @param Rule\SimpleFactory $simpleFactory
     * @param Rule\ThemeFactory $themeFactory
     * @param Rule\ModuleFactory $moduleFactory
     * @param Rule\ModularSwitchFactory $modularSwitchFactory
     */
    public function __construct(
        \Magento\Framework\Filesystem $filesystem,
        Rule\SimpleFactory $simpleFactory,
        Rule\ThemeFactory $themeFactory,
        Rule\ModuleFactory $moduleFactory,
        Rule\ModularSwitchFactory $modularSwitchFactory
    ) {
        $this->filesystem = $filesystem;
        $this->simpleFactory = $simpleFactory;
        $this->themeFactory = $themeFactory;
        $this->moduleFactory = $moduleFactory;
        $this->modularSwitchFactory = $modularSwitchFactory;
    }

    /**
     * @return RuleInterface
     */
    protected function createHtmlTemplateFileRule()
    {
        return $this->modularSwitchFactory->create(
            ['ruleNonModular' =>
            $this->themeFactory->create(
                ['rule' => $this->simpleFactory->create(['pattern' => "<theme_dir>/templates"])]
            ),
            'ruleModular' => new Composite(
                [
                    $this->themeFactory->create(
                        ['rule' => $this->simpleFactory->create(['pattern' => "<theme_dir>/<module_name>/web/template"])]
                    ),
                    $this->themeFactory->create(
                        ['rule' => $this->simpleFactory->create(['pattern' => "<theme_dir>/<module_name>/web/templates"])]
                    ),
                    $this->moduleFactory->create(
                        ['rule' => $this->simpleFactory->create(['pattern' => "<module_dir>/view/<area>/web/template"])]
                    ),
                    $this->moduleFactory->create(
                        ['rule' => $this->simpleFactory->create(['pattern' => "<module_dir>/view/<area>/web/templates"])]
                    ),
                    $this->moduleFactory->create(
                        ['rule' => $this->simpleFactory->create(['pattern' => "<module_dir>/view/base/web/template"])]
                    ),
                    $this->moduleFactory->create(
                        ['rule' => $this->simpleFactory->create(['pattern' => "<module_dir>/view/base/web/templates"])]
                    ),
                ]
            )]
        );
    }

    public function getRule($type)
    {
        if ($type !== self::TYPE_HTML_TEMPLATE_FILE) {
            throw new \InvalidArgumentException("Fallback rule '$type' is not supported by Breeze module");
        }

        if (!isset($this->rules[$type])) {
            $this->rules[$type] = $this->createHtmlTemplateFileRule();
        }

        return $this->rules[$type];
    }
}
