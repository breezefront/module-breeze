<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\View\Design\Fallback\Rule;
use Magento\Framework\View\Design\Fallback\Rule\Composite;
use Magento\Framework\View\Design\Fallback\Rule\RuleInterface;

class HtmlTemplateFileResolutionRulePool extends \Magento\Framework\View\Design\Fallback\RulePool
{
    const TYPE_HTML_TEMPLATE_FILE = 'html_template';

    private array $rules = [];

    public function __construct(
        private Rule\SimpleFactory $simpleFactory,
        private Rule\ThemeFactory $themeFactory,
        private Rule\ModuleFactory $moduleFactory,
        private Rule\ModularSwitchFactory $modularSwitchFactory
    ) {
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
