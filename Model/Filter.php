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

        // https://php.watch/versions/8.2/mbstring-qprint-base64-uuencode-html-entities-deprecated#html
        $html = htmlentities($html);
        $html = htmlspecialchars_decode($html);

        libxml_use_internal_errors(true);
        $document = new \DOMDocument();
        $document->loadHTML($html, LIBXML_HTML_NODEFDTD | LIBXML_SCHEMA_CREATE);

        foreach ($this->domFilters as $filter) {
            $filter->process($document);
        }

        $html = $document->saveHTML($document->documentElement);
        $html = '<!DOCTYPE html>' . $html;

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
            '“' => 'bz-ldquo',
            '”' => 'bz-rdquo',
            '@' => 'bz-at',
        ];
    }
}
