<?php

namespace Swissup\Breeze\Model;

use Magento\Framework\View\Design\ThemeInterface;
use Magento\Theme\Model\ResourceModel\Theme\Collection;
use Magento\Theme\Model\ResourceModel\Theme\CollectionFactory;
use Magento\Theme\Model\Theme\ThemePackageInfo;

class BreezeThemesProvider
{
    /** @var CollectionFactory */
    private $collectionFactory;

    /** @var ThemePackageInfo */
    private $themePackageInfo;

    /** @var array */
    private $breezeThemes = [];

    /** @var Collection */
    private $allThemes;

    public function __construct(
        CollectionFactory $collectionFactory,
        ThemePackageInfo $themePackageInfo
    ) {
        $this->collectionFactory = $collectionFactory;
        $this->themePackageInfo = $themePackageInfo;
    }

    public function getThemes(): array
    {
        if ($this->breezeThemes) {
            return $this->breezeThemes;
        }

        foreach ($this->getAllThemes() as $theme) {
            if ($this->isBreezeTheme($theme)) {
                $theme->setPackageName(
                    $this->themePackageInfo->getPackageName($theme->getFullPath())
                );

                $this->breezeThemes[$theme->getCode()] = $theme;
            }
        }

        ksort($this->breezeThemes);

        return $this->breezeThemes;
    }

    public function getTheme(string $code): ThemeInterface
    {
        if (!$this->breezeThemes) {
            $this->getThemes();
        }

        if (empty($this->breezeThemes[$code])) {
            throw new \Exception("Theme with '{$code}' code not found");
        }

        return $this->breezeThemes[$code];
    }

    private function isBreezeTheme(ThemeInterface $theme = null): bool
    {
        if (!$theme) {
            return false;
        }

        if ($theme->hasIsBreezeTheme()) {
            return $theme->getIsBreezeTheme();
        }

        $result = false;

        if (strpos($theme->getThemePath(), 'Swissup/breeze-') === 0) {
            $result = true;
        } elseif ($theme->getParentId()) {
            $result = $this->isBreezeTheme(
                $this->getAllThemes()->getItemByColumnValue(
                    'theme_id',
                    $theme->getParentId()
                )
            );
        }

        $theme->setIsBreezeTheme($result);

        return $result;
    }

    private function getAllThemes(): Collection
    {
        if (!$this->allThemes) {
            $this->allThemes = $this->collectionFactory->create();
        }

        return $this->allThemes;
    }
}
