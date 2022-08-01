<?php

namespace Swissup\Breeze\Plugin;

class BundleConfig
{
    /**
     * @param \Magento\Deploy\Config\BundleConfig $subject
     * @param array $result
     * @return array
     */
    public function afterGetExcludedDirectories(
        $subject,
        $result
    ) {
        $result[] = 'Swissup_Breeze/bundles';
        $result[] = 'Swissup_Breeze::js'; // module sources
        $result[] = 'Lib::js/breeze/';    // theme and module integrations

        return $result;
    }

    /**
     * @param \Magento\Deploy\Config\BundleConfig $subject
     * @param array $result
     * @return array
     */
    public function afterGetExcludedFiles(
        $subject,
        $result
    ) {
        $result[] = 'Lib::js/breeze.js'; // theme and module integrations

        return $result;
    }
}
