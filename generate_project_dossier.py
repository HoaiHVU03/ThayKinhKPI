# -*- coding: utf-8 -*-
"""
Full Generator for:
THUYET_MINH_DU_AN_VA_DE_AN_THUONG_MAI_HOA_EDUKPI.docx
Ultra-detailed, executive-grade document (Times New Roman 13pt, exquisite styling, tables, legal procedures).
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, border_color="CBD5E1", sz="4"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{border_color}"/>'
        f'<w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{border_color}"/>'
        f'<w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{border_color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def set_callout_borders(table, border_color="0E3A7C", sz="24"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{border_color}"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="none"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def format_paragraph(p, space_before=0, space_after=6, line_spacing=1.25, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    p.alignment = align

def add_p(doc, text="", bold_prefix="", italic_prefix="", space_before=0, space_after=5, line_spacing=1.25, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p = doc.add_paragraph()
    format_paragraph(p, space_before, space_after, line_spacing, align)
    
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.bold = True
        r_b.font.name = "Times New Roman"
        r_b.font.size = Pt(13)
        r_b.font.color.rgb = RGBColor(0x0e, 0x3a, 0x7c) if bold_prefix.endswith(":") or bold_prefix.startswith("•") else RGBColor(0x0f, 0x17, 0x2a)
        
    if italic_prefix:
        r_i = p.add_run(italic_prefix)
        r_i.italic = True
        r_i.font.name = "Times New Roman"
        r_i.font.size = Pt(13)
        r_i.font.color.rgb = RGBColor(0x47, 0x55, 0x69)
        
    if text:
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(13)
        r.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
    return p

def add_bullet(doc, text, bold_prefix="", level=0, space_after=4):
    p = doc.add_paragraph()
    format_paragraph(p, space_before=0, space_after=space_after, line_spacing=1.2, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
    
    bullet_symbol = "• " if level == 0 else "– "
    r_sym = p.add_run(bullet_symbol)
    r_sym.bold = True
    r_sym.font.name = "Times New Roman"
    r_sym.font.size = Pt(13)
    r_sym.font.color.rgb = RGBColor(0x0e, 0x3a, 0x7c) if level == 0 else RGBColor(0x25, 0x63, 0xeb)
    
    if bold_prefix:
        r_b = p.add_run(bold_prefix + " ")
        r_b.bold = True
        r_b.font.name = "Times New Roman"
        r_b.font.size = Pt(13)
        r_b.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)
        
    if text:
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(13)
        r.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
    return p

def add_custom_heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    
    if level == 1:
        format_paragraph(p, space_before=18, space_after=8, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.LEFT)
        r = p.add_run(text)
        r.bold = True
        r.font.name = "Times New Roman"
        r.font.size = Pt(16)
        r.font.color.rgb = RGBColor(0x0e, 0x3a, 0x7c) # Deep Navy
        
        # Subtle horizontal divider
        p_line = doc.add_paragraph()
        format_paragraph(p_line, space_before=0, space_after=6, line_spacing=1.0, align=WD_ALIGN_PARAGRAPH.LEFT)
        r_line = p_line.add_run("━" * 58)
        r_line.font.name = "Times New Roman"
        r_line.font.size = Pt(8)
        r_line.font.color.rgb = RGBColor(0x3b, 0x82, 0xf6)
    elif level == 2:
        format_paragraph(p, space_before=14, space_after=5, line_spacing=1.2, align=WD_ALIGN_PARAGRAPH.LEFT)
        r = p.add_run(text)
        r.bold = True
        r.font.name = "Times New Roman"
        r.font.size = Pt(14)
        r.font.color.rgb = RGBColor(0x1d, 0x4e, 0xd8) # Royal Blue
    elif level == 3:
        format_paragraph(p, space_before=10, space_after=4, line_spacing=1.2, align=WD_ALIGN_PARAGRAPH.LEFT)
        r = p.add_run(text)
        r.bold = True
        r.italic = True
        r.font.name = "Times New Roman"
        r.font.size = Pt(13)
        r.font.color.rgb = RGBColor(0x03, 0x69, 0xa1) # Ocean Slate
    return p

def add_callout(doc, text_list, title="ĐIỂM NHẤN CÔNG NGHỆ & ĐỘT PHÁ NGHIỆP VỤ", box_type="info"):
    colors = {
        "info": {"border": "0E3A7C", "bg": "F0F7FF", "title_rgb": RGBColor(0x0e, 0x3a, 0x7c)},
        "success": {"border": "059669", "bg": "F0FDF4", "title_rgb": RGBColor(0x06, 0x5f, 0x46)},
        "warning": {"border": "D97706", "bg": "FFFBEB", "title_rgb": RGBColor(0x92, 0x40, 0x0e)},
        "law": {"border": "4F46E5", "bg": "F5F3FF", "title_rgb": RGBColor(0x37, 0x30, 0xa3)}
    }
    c_info = colors.get(box_type, colors["info"])
    
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, c_info["bg"])
    set_cell_margins(cell, top=140, bottom=140, left=200, right=160)
    set_callout_borders(tbl, border_color=c_info["border"], sz="28")
    
    p = cell.paragraphs[0]
    format_paragraph(p, space_before=2, space_after=4, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.LEFT)
    r_t = p.add_run(title)
    r_t.bold = True
    r_t.font.name = "Times New Roman"
    r_t.font.size = Pt(12.5)
    r_t.font.color.rgb = c_info["title_rgb"]
    
    for item in text_list:
        p_item = cell.add_paragraph()
        format_paragraph(p_item, space_before=2, space_after=3, line_spacing=1.2, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
        r_item = p_item.add_run(item)
        r_item.font.name = "Times New Roman"
        r_item.font.size = Pt(12)
        r_item.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
        
    p_after = doc.add_paragraph()
    format_paragraph(p_after, space_before=0, space_after=4, line_spacing=1.0)

def add_styled_table(doc, headers, rows_data, col_widths=None):
    tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl, border_color="CBD5E1", sz="4")
    
    # Format Header Row
    hdr_cells = tbl.rows[0].cells
    for i, h_text in enumerate(headers):
        cell = hdr_cells[i]
        set_cell_background(cell, "0E3A7C")
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        format_paragraph(p, space_before=2, space_after=2, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.CENTER)
        r = p.add_run(h_text)
        r.bold = True
        r.font.name = "Times New Roman"
        r.font.size = Pt(11.5)
        r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        
    # Format Data Rows
    for r_idx, row_items in enumerate(rows_data):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_items):
            cell = row_cells[c_idx]
            set_cell_background(cell, bg_col)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            
            align = WD_ALIGN_PARAGRAPH.CENTER if (c_idx == 0 or len(str(cell_value)) <= 6) else WD_ALIGN_PARAGRAPH.LEFT
            format_paragraph(p, space_before=1, space_after=1, line_spacing=1.15, align=align)
            
            r = p.add_run(str(cell_value))
            r.font.name = "Times New Roman"
            r.font.size = Pt(11)
            r.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            
    if col_widths and len(col_widths) == len(headers):
        for row in tbl.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)
                
    p_after = doc.add_paragraph()
    format_paragraph(p_after, space_before=0, space_after=6, line_spacing=1.0)
    return tbl

print("Base setup loaded.")
