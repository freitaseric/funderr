<?php

namespace App\Services\Proposals;

/** Small dependency-free PDF writer for the private operational documents. */
class PdfDocument
{
    public function fromText(string $text): string
    {
        $lines = collect(preg_split('/\R/u', $text) ?: [])->flatMap(function (string $line): array {
            return str_split($line, 95) ?: [''];
        })->values()->all();
        $pages = array_chunk($lines, 48);
        $objects = [];
        $objects[] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[] = '<< /Type /Pages /Kids ['.implode(' ', array_map(fn (int $i): string => ($i + 3).' 0 R', array_keys($pages))).'] /Count '.count($pages).' >>';
        foreach ($pages as $index => $page) {
            $content = "BT\n/F1 10 Tf\n50 790 Td\n";
            foreach ($page as $line) {
                $content .= '('.$this->escape($this->ascii($line)).") Tj\n0 -15 Td\n";
            }
            $content .= "ET\n";
            $contentObject = count($objects) + 1;
            $objects[] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 '.($contentObject + 1).' 0 R >> >> /Contents '.($contentObject + 2).' 0 R >>';
            $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
            $objects[] = '<< /Length '.strlen($content)." >>\nstream\n".$content.'endstream';
        }
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $id => $object) {
            $offsets[$id + 1] = strlen($pdf);
            $pdf .= ($id + 1)." 0 obj\n".$object."\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf('%010d 00000 n ', $offset)."\n";
        }

        return $pdf."trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF";
    }

    private function escape(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);
    }

    private function ascii(string $value): string
    {
        return iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
    }
}
