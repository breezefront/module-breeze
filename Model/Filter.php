<?php

namespace Swissup\Breeze\Model;

class Filter
{
    protected DomDocument $domDocument;

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
     * @param DomDocument $domDocument
     * @param array $domFilters
     * @param array $strFilters
     */
    public function __construct(
        DomDocument $domDocument,
        array $domFilters = [],
        array $strFilters = []
    ) {
        $this->domDocument = $domDocument;
        $this->domFilters = $domFilters;
        $this->strFilters = $strFilters;
    }

    /**
     * @param  string $html Rendered html
     * @return string       Processed html
     */
    public function process($html)
    {
        $document = $this->domDocument->loadHTML($html);

        foreach ($this->domFilters as $filter) {
            $filter->process($document);
        }

        $html = $this->domDocument->saveHTML($document);

        foreach ($this->strFilters as $filter) {
            $html = $filter->process($html);
        }

        return $html;
    }
}
