<?php

namespace Swissup\Breeze\Model;

class Filter
{
    public function __construct(
        protected DomDocument $domDocument,
        protected array $domFilters = [],
        protected array $strFilters = []
    ) {
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
