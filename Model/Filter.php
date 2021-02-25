<?php

namespace Swissup\Breeze\Model;

class Filter
{
    /**
     * @var array
     */
    protected $domFilters;

    /**
     * @var array
     */
    protected $strFilters;

    /**
     * @param array $domFilters
     * @param array $strFilters
     */
    public function __construct(
        array $domFilters = [],
        array $strFilters = []
    ) {
        $this->domFilters = $domFilters;
        $this->strFilters = $strFilters;
    }

    /**
     * @param  string $html Rendered html
     * @return string       Processed html
     */
    public function process($html)
    {
        $html = $this->prepareDomDocumentHtml($html);

        libxml_use_internal_errors(true);
        $document = new \DOMDocument();
        $document->loadHTML($html);

        foreach ($this->domFilters as $filter) {
            $filter->process($document);
        }

        $output = $document->saveHTML();

        foreach ($this->strFilters as $filter) {
            $output = $filter->process($output);
        }

        return $output;
    }

    /**
     * @param  string $html
     * @return string
     */
    private function prepareDomDocumentHtml($html)
    {
        // fix special characters
        if (function_exists('mb_convert_encoding')) {
            $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        }

        // escape too early close tag inner script : <script>alert("</div>")</script>
        // https://stackoverflow.com/questions/236073/why-split-the-script-tag-when-writing-it-with-document-write/236106#236106
        $regExp = '/<script\b[^>]*>(.*?)<\/script>/is';
        $matches = [];
        preg_match_all($regExp, $html, $matches);
        foreach ($matches[1] as $_script) {
            if (strstr($_script, '</')) {
                $html = str_replace($_script, str_replace('</', '<\/', $_script), $html);
            }
        }

        return $html;
    }
}
