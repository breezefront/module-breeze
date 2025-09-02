<?php

namespace Swissup\Breeze\Model;

class DomDocument
{
    public function loadHTML($html): \DOMDocument
    {
        $html = $this->escapeHtmlEntities($html);

        // https://php.watch/versions/8.2/mbstring-qprint-base64-uuencode-html-entities-deprecated#html
        $html = htmlentities($html);
        $html = htmlspecialchars_decode($html);

        libxml_use_internal_errors(true);
        $document = new \DOMDocument();
        $document->loadHTML($html, LIBXML_HTML_NODEFDTD | LIBXML_SCHEMA_CREATE);

        return $document;
    }

    public function saveHTML($document): string
    {
        $html = $document->saveHTML($document->documentElement);
        $html = '<!DOCTYPE html>' . $html;
        $html = $this->unescapeHtmlEntities($html);

        return $html;
    }

    public function getNodeAttribute($node, $code): string
    {
        return $this->unescapeHtmlEntities((string) $node->getAttribute($code));
    }

    public function escapeHtmlEntities($html): string
    {
        return strtr($html, $this->getHtmlEntities());
    }

    public function unescapeHtmlEntities($html): string
    {
        return strtr($html, array_flip($this->getHtmlEntities()));
    }

    public function getHtmlEntities(): array
    {
        return [
            '—' => 'bz-mdash',
            '“' => 'bz-ldquo',
            '”' => 'bz-rdquo',
            '@' => 'bz-at',
            '=>' => 'bz-arrow-fn',
        ];
    }
}
