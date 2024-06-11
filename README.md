# Breeze

Breeze — is a Magento module that replaces Luma's js stack with it's own
implementation. You can use it on top of any Luma/Blank based theme. We use
this module for our [Breeze themes](https://breezefront.com/) as well.

 - [Docs](https://breezefront.com/about)
 - [Demo](https://breeze.swissupdemo.com/)

## Installation

```bash
composer require swissup/module-breeze
bin/magento module:enable Swissup_Breeze Swissup_Rtl
```

## Configuration

> This step is not required when using Breeze-based theme.

 1. Login to Magento backend and open _Content > Design > Configuration_ page.
 2. Select the Store you want to change and press _Edit_.
 3. Scroll down to the _Breeze_ fieldset.
 4. Set "Enable Breeze Experience" to yes and save config.
