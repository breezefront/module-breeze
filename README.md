# Breeze

Breeze — is an alternate approach to get the performant Luma/Blank/Custom based
Magento 2 frontend. It's a Magento 2 module that replaces all javascript with
its own implementation.

## Installation

### For clients

There are several ways to install extension for clients:

 1. If you've bought the product at Magento's Marketplace - use
    [Marketplace installation instructions](https://docs.magento.com/marketplace/user_guide/buyers/install-extension.html)
 2. Otherwise, you have two options:
    - Install the sources directly from [our repository](https://docs.swissuplabs.com/m2/extensions/attributepages/installation/composer/) - **recommended**
    - Download archive and use [manual installation](https://docs.swissuplabs.com/m2/extensions/attributepages/installation/manual/)

### For developers

Use this approach if you have access to our private repositories!

```bash
composer require swissup/module-breeze
bin/magento setup:upgrade
```
