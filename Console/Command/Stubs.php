<?php

namespace Swissup\Breeze\Console\Command;

class Stubs
{
    public function placeholders(string $package)
    {
        list($vendor, $name) = explode('/', $package);

        $module = strtr($name, [
            'module-' => '',
        ]);
        $module = str_replace('-', '', ucwords($module, '-'));

        return [
            '{{package}}' => $package,
            '{{Vendor}}' => ucfirst($vendor),
            '{{Module}}' => $module,
        ];
    }

    public function module(string $package)
    {
        $stubs = [
            'code/{{Vendor}}/{{Module}}/composer.json' => [
                'content' => <<<TEXT
{
    "name": "{{package}}",
    "description": "",
    "type": "magento2-module",
    "version": "1.0.0",
    "license": "OSL-3.0",
    "autoload": {
        "files": [
            "registration.php"
        ],
        "psr-4": {
            "{{Vendor}}\\\\{{Module}}\\\\": ""
        }
    }
}

TEXT,
            ],

            'code/{{Vendor}}/{{Module}}/README.md' => [
                'content' => <<<TEXT
# {{Module}}

## Installation

```bash
composer require {{package}}
bin/magento setup:upgrade --safe-mode=1
```

TEXT,
            ],

            'code/{{Vendor}}/{{Module}}/registration.php' => [
                'content' => <<<TEXT
<?php

use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(ComponentRegistrar::MODULE, '{{Vendor}}_{{Module}}', __DIR__);

TEXT,
            ],

            'code/{{Vendor}}/{{Module}}/etc/module.xml' => [
                'content' => <<<TEXT
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="{{Vendor}}_{{Module}}"/>
</config>

TEXT,
            ],

            'code/{{Vendor}}/{{Module}}/view/frontend/layout/breeze_default.xml' => [
                'content' => <<<TEXT
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceBlock name="breeze.js">
            <arguments>
                <argument name="bundles" xsi:type="array">
                    <item name="default" xsi:type="array">
                        <item name="items" xsi:type="array">
                            <item name="{{Vendor}}_{{Module}}/js/script" xsi:type="array">
                                <item name="path" xsi:type="string">{{Vendor}}_{{Module}}/js/script</item>
                                <!--
                                <item name="enabled" xsi:type="helper" helper="Swissup\Breeze\Helper\Config::isEnabled">
                                    <param name="path">module/general/enabled</param>
                                </item>
                                -->
                            </item>
                        </item>
                    </item>
                </argument>
            </arguments>
        </referenceBlock>
    </body>
</page>

TEXT,
                'skip' => 'noxml',
            ],

            'code/{{Vendor}}/{{Module}}/view/frontend/web/css/breeze/_default.less' => [
                'content' => <<<TEXT
& when (@critical) {
}

& when not (@critical) {
}

TEXT,
                'skip' => 'nocss',
            ],

            'code/{{Vendor}}/{{Module}}/view/frontend/web/js/script.js' => [
                'content' => <<<TEXT
(function () {
    'use strict';

    // $.widget('widgetName', {
    //     component: '{{Vendor}}_{{Module}}/js/component',
    //     create: function () {
    //         console.log(this.element);
    //         console.log(this.options);
    //     }
    // });

    $(document).on('breeze:load', () => {
        console.log('hello from view/frontend/web/js/script.js');
    });
})();

TEXT,
                'skip' => 'nojs',
            ],
        ];

        return $this->process($stubs, $this->placeholders($package));
    }

    private function process(array $stubs, array $placeholders)
    {
        $result = [];

        foreach ($stubs as $path => $values) {
            $result[strtr($path, $placeholders)] = array_merge($values, [
                'content' => strtr($values['content'], $placeholders),
            ]);
        }

        return  $result;
    }
}
