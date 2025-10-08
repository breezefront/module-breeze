<?php

namespace Swissup\Breeze\Console\Command;

class Stubs
{
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
bin/magento module:enable {{Vendor}}_{{Module}}
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
                                <item name="autoload" xsi:type="boolean">true</item>
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
define(['jquery'], function ($) {
    'use strict';

    console.log('hello from view/frontend/web/js/script.js');
});

TEXT,
                'skip' => 'nojs',
            ],
        ];

        return $this->process($stubs, $this->placeholders($package));
    }

    public function theme(string $package, $parentTheme)
    {
        $stubs = [
            'design/frontend/{{Vendor}}/{{theme}}/composer.json' => [
                'content' => <<<TEXT
{
    "name": "{{package}}",
    "description": "",
    "type": "magento2-theme",
    "version": "1.0.0",
    "license": "OSL-3.0",
    "autoload": {
        "files": [
            "registration.php"
        ]
    },
    "require": {
        "{{parent_package}}": "*"
    }
}

TEXT,
            ],

            'design/frontend/{{Vendor}}/{{theme}}/theme.xml' => [
                'content' => <<<TEXT
<theme xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/theme.xsd">
    <title>{{Theme}}</title>
    <parent>{{parent_theme_code}}</parent>
</theme>

TEXT,
            ],

            'design/frontend/{{Vendor}}/{{theme}}/README.md' => [
                'content' => <<<TEXT
# {{Theme}}

## Installation

```bash
composer require {{package}}
```

TEXT,
            ],

            'design/frontend/{{Vendor}}/{{theme}}/registration.php' => [
                'content' => <<<TEXT
<?php

use Magento\Framework\Component\ComponentRegistrar;

ComponentRegistrar::register(ComponentRegistrar::THEME, 'frontend/{{Vendor}}/{{theme}}', __DIR__);

TEXT,
            ],

            'design/frontend/{{Vendor}}/{{theme}}/etc/view.xml' => [
                'content' => <<<TEXT
<?xml version="1.0"?>
<view xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/view.xsd">
    <vars module="Magento_Catalog">
        <var name="gallery">
            <var name="mode">slider</var> <!-- default/expanded/slider -->
        </var>
        <var name="magnifier">
            <var name="enabled">true</var>
        </var>
    </vars>
</view>
TEXT,
            ],

            'design/frontend/{{Vendor}}/{{theme}}/Magento_Theme/layout/default.xml' => [
                'content' => <<<TEXT
<?xml version="1.0"?>
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <!-- <move element="navigation.wrapper" destination="header-wrapper" after="logo"/> -->
        <!-- <move element="navigation.wrapper" destination="header.container"/> -->
        <!-- <referenceBlock name="header.wishlist" remove="true"/> -->
    </body>
</page>

TEXT,
            ],

            'design/frontend/{{Vendor}}/{{theme}}/web/css/_extend.less' => [
                'content' => <<<TEXT
& when (@critical) {
}

& when not (@critical) {
}

TEXT,
            ],

            'design/frontend/{{Vendor}}/{{theme}}/web/js/breeze/extend.js' => [
                'content' => <<<TEXT
define(['jquery'], function ($) {
    'use strict';

    console.log('hello from web/js/breeze/extend.js');
});

TEXT,
            ],
        ];

        return $this->process($stubs, array_merge($this->placeholders($package), [
            '{{parent_package}}' => $parentTheme->getPackageName(),
            '{{parent_theme_code}}' => $parentTheme->getCode(),
        ]));
    }

    public function render(string $template, string $package)
    {
        return strtr($template, $this->placeholders($package));
    }

    private function placeholders(string $package)
    {
        list($vendor, $name) = explode('/', $package);

        $name = strtr($name, [
            'module-' => '',
            'theme-frontend-' => '',
        ]);
        $module = str_replace('-', '', ucwords($name, '-'));

        return [
            '{{package}}' => $package,
            '{{Vendor}}' => ucfirst($vendor),
            '{{Module}}' => $module,
            '{{Theme}}' => $module,
            '{{theme}}' => $name,
        ];
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
