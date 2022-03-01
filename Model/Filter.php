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
     * @var array
     */
    protected $escapedBlocks = [];

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
        $html = $this->escapeHtmlEntities($html);

        // fix special characters
        if (function_exists('mb_convert_encoding')) {
            $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        }

        $html = $this->escapeHtmlInsideScriptTags($html);

        libxml_use_internal_errors(true);
        $document = new \DOMDocument();
        $document->loadHTML($html);

        foreach ($this->domFilters as $filter) {
            $filter->process($document);
        }

        $html = $document->saveHTML();
        $html = $this->unescapeHtmlInsideScriptTags($html);
        $html = $this->unescapeHtmlEntities($html);

        foreach ($this->strFilters as $filter) {
            $html = $filter->process($html);
        }

        return $html;
    }

    private function escapeHtmlEntities($html)
    {
        return strtr($html, $this->getHtmlEntities());
    }

    private function unescapeHtmlEntities($html)
    {
        return strtr($html, array_flip($this->getHtmlEntities()));
    }

    private function getHtmlEntities()
    {
        return [
            '—' => 'bz-mdash',
        ];
    }

    /**
     * Fix broken html within script tag with type="text/x-magento-template"
     * Fix too early close tag inner script : <script>alert("</div>")</script>
     *
     * @see https://stackoverflow.com/questions/236073/why-split-the-script-tag-when-writing-it-with-document-write/236106#236106
     *
     * @param  string $html
     * @return string
     */
    private function escapeHtmlInsideScriptTags($html)
    {
        $matches = [];
        $pattern = '/<script\b[^>]*>(.*?)<\/script>/is';
        preg_match_all($pattern, $html, $matches);

        foreach ($matches[1] as $script) {
            if (strpos($script, '</') === false) {
                continue;
            }

            $escapedScript = str_replace('</', '<\/', $script);
            $html = str_replace($script, $escapedScript, $html);

            $this->escapedBlocks[$script] = $escapedScript;
        }

        return $html;
    }

    /**
     * @param  string $html
     * @return string
     */
    protected function unescapeHtmlInsideScriptTags($html)
    {
        foreach ($this->escapedBlocks as $originalHtml => $escapedHtml) {
            $html = str_replace($escapedHtml, $originalHtml, $html);
        }
        return $html;
    }
}
