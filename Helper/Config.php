<?php

namespace Swissup\Breeze\Helper;

use Magento\Framework\App\Helper\Context;
use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Store\Model\ScopeInterface;

class Config extends AbstractHelper
{
    /**
     * @param stirng $path
     * @return boolean
     */
    public function isEnabled($path)
    {
        return $this->scopeConfig->getValue($path, ScopeInterface::SCOPE_STORE);
    }

    /**
     * Examples:
     *
     * path1 => true
     * path2 => false
     * Result: true, because any of the rows must be true
     *
     * path1,path2 => false  | True if all of nested are true
     * path3,path4 => true
     * Result: true, because any of the rows must be true
     *
     * @return boolean
     */
    public function isAnyEnabled()
    {
        $paths = func_get_args();

        foreach ($paths as $path) {
            if (strpos($path, ',') !== false) {
                $isEnabled = $this->isAllEnabled(explode(',', $path));
            } else {
                $isEnabled = $this->isEnabled($path);
            }

            if ($isEnabled) {
                return true;
            }
        }

        return false;
    }

    /**
     * Examples:
     *
     * path1 => true
     * path2 => false
     * Result: false, because all of the rows must be true
     *
     * path1,path2 => true | True if any of nested is true
     * path3,path4 => true
     * Result: true, because all of the rows must be true
     *
     * path1,path2 => true
     * path3,path4 => true
     * path2,path5 => false
     * Result: false, because all of the rows must be true
     *
     * @return boolean
     */
    public function isAllEnabled()
    {
        $paths = func_get_args();

        foreach ($paths as $path) {
            if (strpos($path, ',') !== false) {
                $isEnabled = $this->isAnyEnabled(explode(',', $path));
            } else {
                $isEnabled = $this->isEnabled($path);
            }

            if (!$isEnabled) {
                return false;
            }
        }

        return true;
    }
}
