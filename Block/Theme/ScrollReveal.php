<?php

namespace Swissup\Breeze\Block\Theme;

use Magento\Framework\App\ObjectManager;
use Magento\Framework\Module\Manager as ModuleManager;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Template;
use Swissup\BreezeThemeEditor\View\Helper\BreezeThemeEditor;

class ScrollReveal extends Template
{
    protected $_template = 'Swissup_Breeze::theme/scroll-reveal.phtml';

    public function __construct(
        Template\Context $context,
        private Json $json,
        private ModuleManager $moduleManager,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function isEnabled(): bool
    {
        // class_exists() only reflects composer autoload availability, not
        // Magento's module enable/disable state — when Swissup_BreezeThemeEditor
        // is disabled its di.xml preferences aren't loaded, so instantiating
        // BreezeThemeEditor (which needs ValueRepositoryInterface) fatals.
        if ($this->moduleManager->isEnabled('Swissup_BreezeThemeEditor')
            && class_exists(BreezeThemeEditor::class)
        ) {
            try {
                $value = ObjectManager::getInstance()
                    ->get(BreezeThemeEditor::class)
                    ->get('animations/scroll-reveal');

                if ($value !== null) {
                    return (bool) $value;
                }
            } catch (\Throwable $e) {
                // fall through to default below
            }
        }

        return (bool) $this->getEnabled();
    }

    public function getTemplate()
    {
        if (!$this->isEnabled()) {
            return '';
        }
        return parent::getTemplate();
    }

    protected function _prepareLayout()
    {
        if ($this->isEnabled()) {
            $this->pageConfig->addBodyClass('scroll-reveal-enabled');
        }
        return parent::_prepareLayout();
    }

    public function getSelectors()
    {
        return array_filter($this->getData('selectors'));
    }

    public function getCssSelector($prefix = '.js '): string
    {
        $selectors = explode(',', implode(',', $this->getSelectors())); // explode on each comma
        $selectors = $prefix . implode(', ' . $prefix, $selectors);
        return $selectors;
    }

    public function getCssSelectorForActiveKeyboard(): string
    {
        return $this->getCssSelector('.js.kbd ');
    }

    public function getJsSelector(): string
    {
        return $this->json->serialize(implode(',', $this->getSelectors()));
    }

    /**
     * Get options for on reveal event
     *
     * @return string
     */
    public function getOnRevealOptions(): string
    {
        $options = $this->getData('on_reveal_options');

        if (!is_array($options)) {
            $options = [];
        }

        return $this->json->serialize($options);
    }
}
