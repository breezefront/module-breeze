<?php

namespace Swissup\Breeze\Helper;

use Magento\Framework\HTTP\Adapter\CurlFactory;

class Curl
{
    public function __construct(
        private CurlFactory $curlFactory
    ) {
    }

    public function deployAndRead($url)
    {
        $curl = $this->curlFactory->create()->setConfig([
            'header' => false,
            'verifypeer' => false,
            'verifyhost' => 0,
        ]);
        $curl->write('GET', $url);

        $data = $curl->read();
        $responseCode = (int) $curl->getInfo(CURLINFO_HTTP_CODE);

        $curl->close();

        if ($responseCode !== 200) {
            throw new \Exception('Unable to read ' . $url);
        }

        return $data;
    }
}
