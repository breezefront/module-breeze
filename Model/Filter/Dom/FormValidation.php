<?php

namespace Swissup\Breeze\Model\Filter\Dom;

use Swissup\Breeze\Model\Filter\AbstractFilter;

class FormValidation extends AbstractFilter
{
    /**
     * @param  \DOMDocument $document
     * @return void
     */
    public function process(\DOMDocument $document)
    {
        // enable native validation
        $nodes = $document->getElementsByTagName('form');
        foreach ($nodes as $node) {
            $node->removeAttribute('novalidate');
        }

        // convert data-validate to html5 validation if possible
        $xpath = new \DOMXPath($document);
        $nodes = $xpath->query('//*[@data-validate]', $document);
        foreach ($nodes as $node) {
            $value = $this->parseJson($this->getNodeAttribute($node, 'data-validate'));

            if (!$value) {
                continue;
            }

            foreach ($value as $validator => $config) {
                if ($config === false) {
                    continue;
                }

                $method = str_replace(' ', '', ucwords(str_replace('-', ' ', $validator)));
                $method = 'apply' . $method;

                if (!method_exists($this, $method)) {
                    continue;
                }

                $this->{$method}($node, $config);
            }
        }
    }

    /**
     * Try to parse incorrect json string
     *
     * @param string
     * @return mixed
     */
    protected function parseJson($string)
    {
        $json = json_decode($string, true);
        if ($json) {
            return $json;
        }

        // try to convert js object into json ecoded string
        $string = preg_replace("/('(.*?)')/", '"$2"', $string);             // 'word' => "word"
        $string = preg_replace("/([a-zA-Z0-9-_]+)\s*:/", '"$1":', $string); // key: => "key":

        return json_decode($string, true);
    }

    public function applyRequired($node)
    {
        $node->setAttribute('required', 'required');
    }

    public function applyValidateEmail($node)
    {
        $node->setAttribute('type', 'email');
    }

    public function applyNumber($node)
    {
        $node->setAttribute('type', 'number');
    }

    public function applyRequiredNumber($node)
    {
        $this->applyRequired($node);
    }

    public function applyValidateItemQuantity($node, $config)
    {
        $this->applyMin($node, $config['minAllowed'] ?? 0);
        $this->applyMax($node, $config['maxAllowed'] ?? 100_000_000);
    }

    public function applyMin($node, $config)
    {
        $node->setAttribute('min', $config);
    }

    public function applyMax($node, $config)
    {
        $node->setAttribute('max', $config);
    }

    public function applyMinlength($node, $config)
    {
        $node->setAttribute('minlength', $config);
    }

    public function applyMaxlength($node, $config)
    {
        $node->setAttribute('maxlength', $config);
    }

    public function applyValidateCustomerPassword($node)
    {
        $this->applyMinlength($node, $node->getAttribute('data-password-min-length') ?: 8);
    }

    public function applyValidateDate($node, $config)
    {
        $parent = $node->parentNode;
        $node->setAttribute('class', $node->getAttribute('class') . ' input-breeze-date abs-visually-hidden');
        $node->setAttribute('tabindex', -1);
        $parent->setAttribute('class', $parent->getAttribute('class') . ' field-breeze-date');

        $date = new \DOMElement('input');
        $parent->insertBefore($date, $node);
        $date->setAttribute('type', 'date');
        $date->setAttribute('class', 'input-breeze-calendar');
    }
}
