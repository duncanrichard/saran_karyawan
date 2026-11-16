<?php

namespace App\Services;

use ZipArchive;

class XlsxReportExporter
{
    /** @param array<int, string> $headers @param array<int, array<int, string|null>> $rows */
    public function download(array $headers, array $rows, string $filename)
    {
        $path = tempnam(sys_get_temp_dir(), 'laporan-tiket-');
        $archive = new ZipArchive;

        if ($path === false || $archive->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'File laporan Excel tidak dapat dibuat.');
        }

        $archive->addFromString('[Content_Types].xml', $this->contentTypes());
        $archive->addFromString('_rels/.rels', $this->rootRelationships());
        $archive->addFromString('xl/workbook.xml', $this->workbook());
        $archive->addFromString('xl/_rels/workbook.xml.rels', $this->workbookRelationships());
        $archive->addFromString('xl/styles.xml', $this->styles());
        $archive->addFromString('xl/worksheets/sheet1.xml', $this->worksheet($headers, $rows));
        $archive->close();

        return response()
            ->download($path, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
            ->deleteFileAfterSend(true);
    }

    private function worksheet(array $headers, array $rows): string
    {
        $sheetRows = [$this->row(1, $headers, true)];
        foreach ($rows as $index => $row) {
            $sheetRows[] = $this->row($index + 2, $row);
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/><col min="3" max="3" width="46" customWidth="1"/><col min="4" max="9" width="20" customWidth="1"/></cols>'
            .'<sheetData>'.implode('', $sheetRows).'</sheetData></worksheet>';
    }

    private function row(int $number, array $values, bool $header = false): string
    {
        $cells = [];
        foreach ($values as $index => $value) {
            $reference = $this->columnName($index + 1).$number;
            $style = $header ? ' s="1"' : '';
            $cells[] = '<c r="'.$reference.'" t="inlineStr"'.$style.'><is><t>'.$this->escape((string) ($value ?? '')).'</t></is></c>';
        }

        return '<row r="'.$number.'">'.implode('', $cells).'</row>';
    }

    private function columnName(int $column): string
    {
        $name = '';
        while ($column > 0) {
            $column--;
            $name = chr(65 + ($column % 26)).$name;
            $column = intdiv($column, 26);
        }

        return $name;
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }

    private function contentTypes(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
    }

    private function rootRelationships(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    }

    private function workbook(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Laporan tiket" sheetId="1" r:id="rId1"/></sheets></workbook>';
    }

    private function workbookRelationships(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    }

    private function styles(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF183F37"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>';
    }
}
