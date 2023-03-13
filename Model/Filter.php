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

        $html = $this->escapeNestedHtmlTags($html);

        libxml_use_internal_errors(true);
        $document = new \DOMDocument();
        $document->loadHTML($html);

        foreach ($this->domFilters as $filter) {
            $filter->process($document);
        }

        $html = $document->saveHTML($document->documentElement);
        $html = '<!DOCTYPE html>' . $html;

        $html = $this->unescapeNestedHtmlTags($html);
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
    private function escapeNestedHtmlTags($html)
    {
        $matches = [];
        $patterns = [
            '/<(script|style)\b[^>]*>(.*?)<\/\1>/is',
        ];

        foreach ($patterns as $pattern) {
            preg_match_all($pattern, $html, $matches);

            foreach ($matches[2] as $rawHtml) {
                if (strpos($rawHtml, '</') === false) {
                    continue;
                }

                $escapedHtml = str_replace('</', '<\/', $rawHtml);
                $html = str_replace($rawHtml, $escapedHtml, $html);

                $this->escapedBlocks[$rawHtml] = $escapedHtml;
            }
        }

        return $html;
    }

    /**
     * @param  string $html
     * @return string
     */
    protected function unescapeNestedHtmlTags($html)
    {
        foreach ($this->escapedBlocks as $originalHtml => $escapedHtml) {
            $html = str_replace($escapedHtml, $originalHtml, $html);
        }
        return $html;
    }
}
