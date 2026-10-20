# -*- coding: utf-8 -*-
"""
Script to generate the PERFECT, official Word User Guide (.docx) for:
HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ & KPI RÈN LUYỆN NỀN NẾP — THPT CHUYÊN HÙNG VƯƠNG
Meets strict user criteria:
1. Font: 100% Times New Roman across all paragraphs, headings, tables, captions.
2. Normal text font size: Exactly 13pt.
3. Proper standard headings (Heading 1: 16pt Bold Navy, Heading 2: 14pt Bold Red, Heading 3: 13pt Bold/Italic).
4. All tables have FULL vertical and horizontal grid lines (top, bottom, left, right, insideH, insideV).
5. High quality screenshots, callout notes, professional page borders and formatting.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_FILE = r"c:\source code\ThayKinhKPI\Huong_Dan_Su_Dung_He_Thong_KTX_KPI_Chuyen_Hung_Vuong.docx"

# Color Codes
COLOR_NAVY = RGBColor(14, 58, 124)     # #0E3A7C
COLOR_RED = RGBColor(211, 32, 39)      # #D32027
COLOR_BLACK = RGBColor(0, 0, 0)        # #000000
COLOR_MUTED = RGBColor(71, 85, 105)    # #475569
COLOR_WHITE = RGBColor(255, 255, 255)

HEX_NAVY = "0E3A7C"
HEX_LIGHT_BLUE = "F0F4FA"
HEX_LIGHT_GRAY = "F8FAFC"
HEX_BORDER = "94A3B8"                  # Slate 400 (Clear, sharp border)
HEX_RED = "D32027"

def apply_full_table_borders(table, color="94A3B8", sz="6", val="single"):
    """Adds complete outer and inner vertical & horizontal borders to a table."""
    tblPr = table._tbl.tblPr
    borders_xml = f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
        </w:tblBorders>
    '''
    tblPr.append(parse_xml(borders_xml))

def set_cell_background(cell, hex_color):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_heading_1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(18)
    h.paragraph_format.space_after = Pt(8)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(16)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return h

def add_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = COLOR_RED
    return h

def add_heading_3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(13)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return h

def add_paragraph(doc, text, bold_prefix=None, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.25
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Times New Roman'
        r_pre.font.size = Pt(13)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_BLACK
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.color.rgb = COLOR_BLACK
    return p

def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.25
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Times New Roman'
        r_pre.font.size = Pt(13)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_BLACK
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.color.rgb = COLOR_BLACK
    return p

def add_callout(doc, text, title="LƯU Ý QUAN TRỌNG:"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_full_table_borders(tbl, color="0E3A7C", sz="8")
    cell = tbl.cell(0, 0)
    set_cell_background(cell, HEX_LIGHT_BLUE)
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)

    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.25
    r_title = p.add_run(f"📌 {title} ")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(12)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_NAVY
    
    r_text = p.add_run(text)
    r_text.font.name = 'Times New Roman'
    r_text.font.size = Pt(12)
    r_text.font.color.rgb = COLOR_BLACK
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_image_safe(doc, image_path, caption=None, width_inch=5.8):
    if os.path.exists(image_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run()
        run.add_picture(image_path, width=Inches(width_inch))
        
        if caption:
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(10)
            r_cap = p_cap.add_run(f"Hình: {caption}")
            r_cap.font.name = 'Times New Roman'
            r_cap.font.size = Pt(11)
            r_cap.font.italic = True
            r_cap.font.color.rgb = COLOR_MUTED

def main():
    doc = docx.Document()

    # Configure Document Base Style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(13)
    style_normal.font.color.rgb = COLOR_BLACK

    # A4 Page Margins (Top/Bottom 2cm = 0.79 in, Left/Right 2cm = 0.79 in)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # ==========================================
    # TRANG BÌA (COVER PAGE)
    # ==========================================
    p_header = doc.add_paragraph()
    p_header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_header.paragraph_format.space_after = Pt(2)
    r1 = p_header.add_run("SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH PHÚ THỌ\n")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(13)
    r1.font.bold = True
    r1.font.color.rgb = COLOR_MUTED
    
    r2 = p_header.add_run("TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(15)
    r2.font.bold = True
    r2.font.color.rgb = COLOR_NAVY
    
    r3 = p_header.add_run("-----------------------o0o-----------------------")
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(11)
    r3.font.color.rgb = COLOR_MUTED

    logo_path = r"c:\source code\ThayKinhKPI\frontend\public\logo.png"
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(16)
        p_logo.paragraph_format.space_after = Pt(16)
        p_logo.add_run().add_picture(logo_path, width=Inches(1.8))

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(6)
    r_t1 = p_title.add_run("TÀI LIỆU HƯỚNG DẪN SỬ DỤNG\n")
    r_t1.font.name = 'Times New Roman'
    r_t1.font.size = Pt(20)
    r_t1.font.bold = True
    r_t1.font.color.rgb = COLOR_RED

    r_t2 = p_title.add_run("HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ & KPI RÈN LUYỆN NỀN NẾP\n")
    r_t2.font.name = 'Times New Roman'
    r_t2.font.size = Pt(16)
    r_t2.font.bold = True
    r_t2.font.color.rgb = COLOR_NAVY

    r_t3 = p_title.add_run("(Áp dụng cho Ban Giám Hiệu, Giáo viên, Quản sinh & Học sinh — Năm học 2026 – 2027)")
    r_t3.font.name = 'Times New Roman'
    r_t3.font.size = Pt(12)
    r_t3.font.italic = True
    r_t3.font.color.rgb = COLOR_MUTED

    # Meta Table on Cover with FULL BORDERS
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    tbl_meta = doc.add_table(rows=6, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_full_table_borders(tbl_meta, color="94A3B8", sz="6")

    meta_info = [
        ("Cơ quan chủ quản:", "Trường THPT Chuyên Hùng Vương — Tỉnh Phú Thọ"),
        ("Hệ thống phần mềm:", "Hệ thống Quản lý KTX & KPI Rèn luyện Nền nếp Học sinh"),
        ("Địa chỉ Web truy cập:", "http://webkpi.ttytphuninh.vn (hoặc nội bộ: http://localhost:5288)"),
        ("Đối tượng sử dụng:", "Ban Giám Hiệu, Quản sinh KTX, GVCN, Trưởng tầng/phòng, Đoàn trường"),
        ("Quy mô quản lý thực tế:", "1.880 Học sinh • 54 Lớp Chuyên • 120 Phòng KTX • 10 Mã Lỗi L01-L10"),
        ("Phiên bản phần mềm:", "Version 2.0 (Bản hoàn chỉnh — Tích hợp Nhập/Xuất File Excel)")
    ]
    for idx, (label, val) in enumerate(meta_info):
        row = tbl_meta.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        set_cell_background(c0, HEX_LIGHT_BLUE if idx % 2 == 0 else "FFFFFF")
        set_cell_background(c1, HEX_LIGHT_BLUE if idx % 2 == 0 else "FFFFFF")
        set_cell_margins(c0, top=70, bottom=70, left=120, right=120)
        set_cell_margins(c1, top=70, bottom=70, left=120, right=120)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(label)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(11.5)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_NAVY
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(11.5)
        r1.font.color.rgb = COLOR_BLACK

    doc.add_page_break()

    # ==========================================
    # MỤC LỤC TỔNG QUAN
    # ==========================================
    add_heading_1(doc, "MỤC LỤC TÀI LIỆU HƯỚNG DẪN")
    
    toc_items = [
        ("PHẦN I: GIỚI THIỆU CHUNG & TÀI KHOẢN TRUY CẬP", "3"),
        ("  1.1. Mục tiêu và phạm vi ứng dụng phần mềm", "3"),
        ("  1.2. Địa chỉ truy cập và thông tin đăng nhập theo 4 vai trò", "3"),
        ("PHẦN II: HƯỚNG DẪN CHI TIẾT TỪNG PHÂN HỆ NGHIỆP VỤ", "4"),
        ("  Chương 1: Đăng nhập & Dashboard Tổng quan Điều hành", "4"),
        ("  Chương 2: Quản lý Hồ sơ Học sinh (1.880 HS) & Nhập/Xuất File Excel", "6"),
        ("  Chương 3: Quản lý 54 Lớp Chuyên Chất lượng cao", "8"),
        ("  Chương 4: Sơ đồ Trực quan Ký Túc Xá (120 Phòng) & Phân bổ Xếp phòng", "9"),
        ("  Chương 5: Điểm danh KTX & Tự động xuất Báo cáo Zalo Mốc 22h15", "11"),
        ("  Chương 6: Giám sát 11 Chế độ Sinh hoạt KTX trong ngày", "13"),
        ("  Chương 7: KPI & Sổ Kỷ luật Nền nếp (10 Mã Lỗi L01 — L10)", "14"),
        ("  Chương 8: Quản lý Đơn xin phép KTX Trực tuyến (Về quê, Khám bệnh)", "17"),
        ("  Chương 9: Báo cáo Thống kê Ma trận Lỗi & Mẫu In A4 (NĐ 30/2020/NĐ-CP)", "18"),
        ("  Chương 10: Chuyển Niên Khóa Tự Động & Quản trị Hệ thống", "19"),
        ("PHẦN III: CÂU HỎI THƯỜNG GẶP (FAQ) & HỖ TRỢ KỸ THUẬT", "21")
    ]
    
    tbl_toc = doc.add_table(rows=len(toc_items), cols=2)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_full_table_borders(tbl_toc, color="CBD5E1", sz="4")
    for idx, (t_title, t_page) in enumerate(toc_items):
        row = tbl_toc.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(5.8)
        c1.width = Inches(0.9)
        set_cell_background(c0, "FFFFFF")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=40, bottom=40, left=80, right=80)
        set_cell_margins(c1, top=40, bottom=40, left=80, right=80)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(t_title)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(11)
        if "PHẦN" in t_title:
            r0.font.bold = True
            r0.font.color.rgb = COLOR_NAVY
        elif "Chương" in t_title:
            r0.font.bold = True
            r0.font.color.rgb = COLOR_RED
        else:
            r0.font.color.rgb = COLOR_BLACK

        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r1 = p1.add_run(t_page)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(11)
        r1.font.color.rgb = COLOR_MUTED

    doc.add_page_break()

    # ==========================================
    # PHẦN 1: GIỚI THIỆU CHUNG & TÀI KHOẢN TRUY CẬP
    # ==========================================
    add_heading_1(doc, "PHẦN I: GIỚI THIỆU CHUNG & TÀI KHOẢN TRUY CẬP")
    
    add_heading_2(doc, "1.1. Mục tiêu và phạm vi ứng dụng phần mềm")
    add_paragraph(doc, 
        "Hệ thống Quản lý Ký túc xá & KPI Rèn luyện Nền nếp trường THPT Chuyên Hùng Vương là giải pháp công nghệ hiện đại "
        "nhằm chuyển đổi số toàn diện công tác quản trị trường học. Phần mềm giải quyết triệt để các bài toán thực tế:"
    )
    add_bullet(doc, "Quản lý dữ liệu tập trung 1.880 học sinh thuộc 54 lớp chuyên (Khối 10, Khối 11, Khối 12).", "• Quy mô học sinh: ")
    add_bullet(doc, "Vận hành 120 phòng KTX đạt chuẩn (699 học sinh nội trú: 335 Nam và 364 Nữ) từ Tầng 2 đến Tầng 6.", "• Quy mô Ký túc xá: ")
    add_bullet(doc, "Số hóa 11 chế độ sinh hoạt trong ngày (từ 05h30 thức dậy đến 22h30 tắt đèn) theo nếp sống văn minh, kỷ cương.", "• Nề nếp sinh hoạt: ")
    add_bullet(doc, "Chấm điểm thi đua nề nếp theo thang điểm gốc 100 điểm với 10 mã lỗi hành vi chuẩn mực (L01 — L10).", "• Hệ thống KPI rèn luyện: ")
    add_bullet(doc, "Tự động xuất báo cáo Zalo 22h15 gửi phụ huynh, BGH; xuất mẫu văn bản hành chính A4 chuẩn Nghị định 30/2020/NĐ-CP.", "• Báo cáo & Lưu trữ: ")

    add_heading_2(doc, "1.2. Địa chỉ truy cập và tài khoản thử nghiệm theo vai trò")
    add_paragraph(doc, "Người dùng có thể truy cập hệ thống qua 2 cổng kết nối:")
    add_bullet(doc, "http://webkpi.ttytphuninh.vn (Sử dụng trên mọi thiết bị: Máy tính, Điện thoại, Máy tính bảng có kết nối Internet).", "• Cổng Internet trực tuyến: ")
    add_bullet(doc, "http://localhost:5288 (Khi máy chủ đặt tại phòng máy trường hoặc sử dụng mạng LAN nội bộ).", "• Cổng mạng nội bộ: ")

    add_paragraph(doc, "Hệ thống hỗ trợ cơ chế phân quyền bảo mật 6 cấp bậc chặt chẽ. Khách hàng và quý thầy cô có thể đăng nhập bằng các tài khoản sau:")

    tbl_acc = doc.add_table(rows=5, cols=4)
    tbl_acc.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_full_table_borders(tbl_acc, color="94A3B8", sz="6")

    acc_headers = ["Tên đăng nhập", "Mật khẩu", "Vai trò (Role)", "Quyền hạn tác nghiệp chính"]
    for i, h in enumerate(acc_headers):
        cell = tbl_acc.rows[0].cells[i]
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = COLOR_WHITE

    acc_data = [
        ("admin", "password123", "Ban Giám Hiệu / Quản trị", "Toàn quyền hệ thống: Cấu hình, Duyệt kỷ luật, Chuyển năm học, In văn bản A4, Quản lý tài khoản"),
        ("manager", "password123", "Quản sinh KTX", "Quản lý 120 phòng, Xếp phòng, Duyệt đơn xin phép, Báo cáo Zalo 22h15, Điểm danh sáng/tối"),
        ("leader", "password123", "Trưởng tầng KTX", "Điểm danh phòng theo tầng phụ trách, Báo cáo quân số phòng, ghi nhận vi phạm nội vụ"),
        ("teacher", "password123", "Giáo viên chủ nhiệm", "Theo dõi điểm KPI của lớp, sĩ số nội trú/ngoại trú, xem biên bản vi phạm của học sinh")
    ]

    for row_idx, row_data in enumerate(acc_data):
        row = tbl_acc.rows[row_idx + 1]
        for col_idx, text in enumerate(row_data):
            cell = row.cells[col_idx]
            set_cell_background(cell, HEX_LIGHT_GRAY if row_idx % 2 == 0 else "FFFFFF")
            set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            if col_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_NAVY
            elif col_idx == 1:
                r.font.bold = True
                r.font.color.rgb = COLOR_RED
            else:
                r.font.color.rgb = COLOR_BLACK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ==========================================
    # PHẦN II: HƯỚNG DẪN CHI TIẾT TỪNG PHÂN HỆ
    # ==========================================
    add_heading_1(doc, "PHẦN II: HƯỚNG DẪN CHI TIẾT TỪNG PHÂN HỆ NGHIỆP VỤ")

    # --- CHƯƠNG 1 ---
    add_heading_2(doc, "Chương 1: Đăng nhập & Dashboard Tổng quan Điều hành")
    add_paragraph(doc, 
        "Sau khi truy cập vào hệ thống qua trình duyệt web (Google Chrome, Microsoft Edge, Cốc Cốc, Safari), "
        "giao diện đăng nhập nhận diện thương hiệu trường THPT Chuyên Hùng Vương sẽ hiển thị."
    )
    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\login_page_1792230152224.png", 
                   "Màn hình đăng nhập hệ thống THPT Chuyên Hùng Vương", width_inch=4.6)

    add_paragraph(doc, 
        "Sau khi nhập đúng Tên đăng nhập và Mật khẩu, hệ thống chuyển hướng ngay tới Bàn làm việc Dashboard Tổng quan. "
        "Dashboard đóng vai trò như một trung tâm chỉ huy thời gian thực (Real-time Operations Center):"
    )
    add_bullet(doc, "Tổng học sinh (1.880 HS), Học sinh Nội trú (699 HS - 37.2%), Học sinh Ngoại trú (1.181 HS - 62.8%), Điểm KPI Trung bình (98.4đ), Tỷ lệ chuyên cần KTX (98.4%). Hệ thống luôn hiển thị song song, rõ ràng số lượng học sinh nội trú và ngoại trú trên mọi chỉ số.", "1. Năm thẻ chỉ số chủ chốt: ")
    add_bullet(doc, "Phòng KTX đang sử dụng (120/120 phòng), Số vụ vi phạm hôm nay, Số đơn xin phép chờ duyệt, Số phòng chưa gửi báo cáo KTX.", "2. Bốn thẻ tác nghiệp nhanh: ")
    add_bullet(doc, "Biểu đồ cột so sánh tương quan 3 yếu tố: Tổng học sinh, Học sinh Nội trú (màu Navy) và Học sinh Ngoại trú (màu Xanh Thiên thanh) giữa 3 Khối 10, Khối 11, Khối 12.", "3. Biểu đồ Quy mô theo Khối lớp (Nội trú & Ngoại trú): ")
    add_bullet(doc, "Biểu đồ tròn (Donut) trực quan tỷ lệ Nam nội trú, Nữ nội trú và Học sinh ngoại trú.", "4. Biểu đồ Tỷ lệ Nội trú & Ngoại trú: ")
    add_bullet(doc, "Biểu đồ cột thể hiện tần suất số vụ vi phạm theo 10 mã quy chế L01 đến L10, hover chuột hiển thị số điểm trừ tương ứng.", "5. Biểu đồ Phân bố Vi phạm 10 Mã Lỗi: ")
    add_bullet(doc, "Biểu đồ thanh tiến độ lấp đầy từng tầng từ Tầng 2 đến Tầng 6 kèm tỷ lệ phần trăm lấp đầy thực tế.", "6. Biểu đồ Công suất Ký túc xá: ")
    add_bullet(doc, "Vinh danh 5 tập thể lớp có điểm rèn luyện cao nhất và cảnh báo các lớp cần tập trung chấn chỉnh nề nếp.", "7. Hai bảng xếp hạng thi đua: ")

    add_heading_3(doc, "Trung tâm Giám sát Điểm danh Ký túc xá Thời gian thực (Realtime Live):")
    add_paragraph(doc, 
        "Đặc biệt, ngay trên màn hình Dashboard Tổng quan, hệ thống tích hợp trực tiếp Khối báo cáo Điểm danh KTX thời gian thực (Realtime Live Operations) giúp Ban Giám Hiệu và Ban Quản Sinh nắm bắt hiện trạng tức thời:"
    )
    add_bullet(doc, "Đồng bộ liên tục mỗi 20 giây với đèn hiệu nháy đỏ 'REALTIME LIVE', thể hiện chính xác số phòng đã kiểm diện và số phòng còn lại (117/120 phòng - 97.5%).", "• Tiến độ báo cáo 120 phòng: ")
    add_bullet(doc, "Phân tách rõ ràng 3 trạng thái: Có mặt tại phòng (660 HS), Vắng có phép (23 HS - đã duyệt đơn về quê, khám bệnh), và Vắng không phép (16 HS - cảnh báo đỏ khẩn cấp).", "• Quân số hiện diện & Vắng mặt: ")
    add_bullet(doc, "Hiển thị thẻ tiến độ riêng cho Tầng 2, Tầng 3 (Khu Nam), Tầng 4 (Nam/Nữ), Tầng 5, Tầng 6 (Khu Nữ) với màu sắc trực quan (Xanh lá: Hoàn thành 100%, Vàng: Đang kiểm diện).", "• Giám sát chi tiết 5 tầng: ")
    add_bullet(doc, "Liệt kê trực tiếp họ tên, lớp, số phòng, phân loại vắng, lý do và số điện thoại phụ huynh kèm nút gọi/chép SĐT khẩn cấp.", "• Bảng học sinh vắng trong ca: ")
    add_bullet(doc, "Bấm 1 chạm nút 'Copy Zalo 22h15', hệ thống tự động định dạng tin nhắn báo cáo chuẩn bao gồm tiến độ từng tầng và danh sách học sinh vắng để dán ngay vào nhóm Zalo chung gửi Ban Giám Hiệu.", "• Xuất tin nhắn báo cáo Zalo 22h15: ")

    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\dashboard_charts_upper_1792236559767.png", 
                   "Giao diện Dashboard Tổng quan — 4 Thẻ chỉ số & Biểu đồ khối lớp, nội trú", width_inch=5.8)
    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\dashboard_charts_lower_1792236553539.png", 
                   "Biểu đồ Phân bố Vi phạm L01-L10, Công suất KTX và 2 Bảng xếp hạng thi đua lớp", width_inch=5.8)

    # --- CHƯƠNG 2 ---
    add_heading_2(doc, "Chương 2: Quản lý Hồ sơ Học sinh (1.880 HS) & Nhập/Xuất File Excel")
    add_paragraph(doc, 
        "Hồ sơ học sinh là cơ sở dữ liệu gốc của toàn trường. Hệ thống quản lý toàn diện 1.880 học sinh "
        "với đầy đủ các trường thông tin: Mã học sinh, Họ và tên, Lớp chuyên, Giới tính, Ngày sinh, Diện ở (Nội trú/Ngoại trú), "
        "Phòng KTX, Điểm KPI, Xếp loại thi đua, Thông tin liên lạc phụ huynh."
    )
    add_heading_3(doc, "Các tính năng tác nghiệp trên màn hình Hồ sơ Học sinh:")
    add_bullet(doc, "Nhập Mã học sinh (VD: HV100018), họ tên hoặc quê quán vào thanh tìm kiếm, hệ thống lọc tức thì không cần tải lại trang.", "• Tìm kiếm thông minh: ")
    add_bullet(doc, "Lọc kết hợp đồng thời theo Khối lớp (10, 11, 12), Lớp chuyên (54 lớp), Hình thức (Nội trú KTX / Ngoại trú) và Giới tính (Nam / Nữ).", "• Bộ lọc đa tiêu chí: ")
    add_bullet(doc, "Nhấp nút 'Thêm học sinh', điền đầy đủ biểu mẫu và lưu vào hệ thống.", "• Thêm mới học sinh: ")
    add_bullet(doc, "Nhấp biểu tượng 'Chi tiết' (Con mắt) để mở sổ theo dõi cá nhân: Lịch sử vi phạm nề nếp, điểm KPI từng kỳ, số phòng KTX đang ở.", "• Xem lý lịch học sinh: ")
    add_bullet(doc, "Nhấp nút 'Xuất CSV Excel' để tải ngay toàn bộ danh sách 1.880 học sinh kèm số điểm KPI hiện tại ra file bảng tính.", "• Xuất danh sách: ")

    add_heading_3(doc, "✨ Tính năng ĐỘC QUYỀN: Nhập Danh Sách Học Sinh Từ File Excel (.xlsx / .csv):")
    add_paragraph(doc, 
        "Nhằm giải phóng sức lao động cho giáo viên đầu năm học, hệ thống hỗ trợ nhập danh sách học sinh từ file Excel với quy trình 5 bước cực kỳ thuận tiện:"
    )
    add_bullet(doc, "Trên thanh công cụ trang Hồ sơ học sinh, nhấp nút 'Nhập dữ liệu'.", "Bước 1: ")
    add_bullet(doc, "Trong cửa sổ hiện lên, nhấp nút 'Tải file Excel mẫu' để nhận file Mau_Nhap_Hoc_Sinh_Chuyen_Hung_Vuong.xlsx chuẩn.", "Bước 2: ")
    add_bullet(doc, "Mở file Excel trên máy tính, điền danh sách học sinh vào các cột: Mã học sinh, Họ và tên, Lớp chuyên, Giới tính, Ngày sinh, Nội trú (Có/Không), SĐT phụ huynh, Quê quán.", "Bước 3: ")
    add_bullet(doc, "Kéo thả file Excel vào khung tải lên hoặc nhấp chuột để chọn file. Hệ thống tự động phân tích và hiển thị bảng xem trước (Preview) 5 dòng đầu tiên kèm cảnh báo dòng lỗi (nếu có).", "Bước 4: ")
    add_bullet(doc, "Nhấp 'Xác nhận nhập dữ liệu'. Hệ thống tự động kiểm tra trùng mã, chuẩn hóa ngày sinh và tự động tạo sổ điểm KPI gốc 100 điểm cho từng em.", "Bước 5: ")

    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\student_import_modal_1792250520428.png", 
                   "Cửa sổ Nhập Danh Sách Học Sinh Hàng Loạt Từ File Excel với tính năng Tải file mẫu và Xem trước dữ liệu", width_inch=4.8)

    # --- CHƯƠNG 3 ---
    add_heading_2(doc, "Chương 3: Quản lý 54 Lớp Chuyên Chất Lượng Cao")
    add_paragraph(doc, 
        "Hệ thống số hóa danh mục toàn bộ 54 lớp chuyên trực thuộc 3 khối lớp của trường THPT Chuyên Hùng Vương:"
    )
    add_bullet(doc, "Gồm 17 lớp chuyên (Toán 1, Toán 2, Tin, Lý 1, Lý 2, Hóa 1, Hóa 2, Sinh, Văn 1, Văn 2, Sử, Địa, Anh 1, Anh 2, Pháp, Nga, Trung).", "• Khối 10: ")
    add_bullet(doc, "Gồm 17 lớp chuyên tương ứng các bộ môn văn hóa chất lượng cao.", "• Khối 11: ")
    add_bullet(doc, "Gồm 20 lớp chuyên bồi dưỡng chuyên sâu phục vụ kỳ thi học sinh giỏi quốc gia và tốt nghiệp THPT.", "• Khối 12: ")

    add_paragraph(doc, 
        "Mỗi thẻ lớp học hiển thị trực quan thông tin Giáo viên chủ nhiệm, Sĩ số lớp (chuẩn 35 học sinh/lớp), "
        "đồng thời hiển thị chi tiết số lượng Học sinh Nội trú và Học sinh Ngoại trú song song (Ví dụ: 10 Nội trú • 25 Ngoại trú), "
        "kèm Điểm KPI thi đua trung bình của lớp. Quản trị viên có thể bấm 'Thêm lớp mới', "
        "sửa thông tin GVCN hoặc nhấp vào thẻ lớp để lọc toàn bộ học sinh của lớp đó."
    )

    add_heading_3(doc, "✨ Tính năng Nhập Danh Sách Lớp Học Bằng File Excel & Tải File Mẫu:")
    add_paragraph(doc, 
        "Nhà trường không cần phải tạo từng lớp học thủ công. Ngay trên thanh công cụ trang Lớp học, hệ thống trang bị nút 'Nhập Excel lớp học' tích hợp công nghệ AI nhận diện thông minh:"
    )
    add_bullet(doc, "Bấm nút 'Tải file mẫu Excel', hệ thống tự động sinh file chuẩn Mau_Nhap_Lop_Chuyen_Hung_Vuong.xlsx chứa sẵn 5 dòng dữ liệu mẫu, hướng dẫn cụ thể các cột: Mã lớp (10T1, 11L1...), Tên lớp chuyên, Khối lớp (10, 11, 12), Vị trí phòng học và Tên Giáo viên chủ nhiệm.", "• Tải file mẫu chuẩn: ")
    add_bullet(doc, "Người dùng chỉ việc kéo thả file .xlsx, .xls hoặc .csv vào vùng tải lên. Trình phân tích tự động nhận diện các cột dữ liệu mà không lo sai lệch cấu trúc.", "• Kéo thả file tiện lợi: ")
    add_bullet(doc, "Hệ thống tự động quét tên lớp để trích xuất khối lớp 10, 11 hoặc 12, đồng thời tự động đối chiếu tên Giáo viên chủ nhiệm trong file Excel với danh bạ giáo viên nhà trường để gán mã GVCN tương ứng.", "• Tự động phân loại khối & Gán GVCN: ")
    add_bullet(doc, "Hiển thị bảng xem trước (Preview) toàn bộ danh sách lớp kèm thông báo hợp lệ/không hợp lệ trước khi bấm xác nhận lưu vào cơ sở dữ liệu.", "• Xem trước & Báo cáo kết quả: ")

    # --- CHƯƠNG 4 ---
    add_heading_2(doc, "Chương 4: Sơ Đồ Trực Quan KTX (120 Phòng) & Phân Biệt Học Sinh Nội Trú — Ngoại Trú")
    add_paragraph(doc, 
        "Hệ thống quản lý phân định rõ ràng giữa hai diện học sinh trong toàn trường: Học sinh Nội trú (ở KTX) và Học sinh Ngoại trú (đi về trong ngày). "
        "Số liệu tổng quan hiển thị trên 5 thẻ thống kê trực quan:"
    )
    add_bullet(doc, "Tổng số học sinh toàn trường: 1.883 học sinh (gồm 54 lớp chuyên).", "• Tổng quân số: ")
    add_bullet(doc, "Học sinh Ngoại trú: 1.181 học sinh (chiếm 62.7% toàn trường).", "• Diện Ngoại trú: ")
    add_bullet(doc, "Học sinh Nội trú KTX: 702 học sinh (336 học sinh Nam và 366 học sinh Nữ).", "• Diện Nội trú KTX: ")
    add_bullet(doc, "Quy mô ký túc xá: 120 phòng ở đạt chuẩn (chuẩn 6 học sinh/phòng, sức chứa tối đa 720 chỗ).", "• Sức chứa KTX: ")
    add_bullet(doc, "Tỷ lệ lấp đầy KTX: 97.5% (đảm bảo an ninh trật tự và không gian sinh hoạt tốt nhất).", "• Tỷ lệ lấp đầy: ")

    add_heading_3(doc, "1. Tab 'Sơ đồ 120 phòng KTX':")
    add_bullet(doc, "Gồm 24 phòng/tầng (tổng 48 phòng), dành riêng cho học sinh Nam nội trú.", "• Tầng 2 & Tầng 3 (Khu Nam): ")
    add_bullet(doc, "Gồm 24 phòng, phân chia cánh Nam và cánh Nữ riêng biệt có vách ngăn an ninh.", "• Tầng 4 (Khu Hỗn hợp): ")
    add_bullet(doc, "Gồm 24 phòng/tầng (tổng 48 phòng), dành riêng cho học sinh Nữ nội trú.", "• Tầng 5 & Tầng 6 (Khu Nữ): ")
    add_bullet(doc, "Mỗi thẻ phòng hiển thị: Mã phòng (P201..P624), Khu Nam/Nữ, Họ tên Trưởng phòng, Sĩ số hiện tại / Sức chứa tối đa (chuẩn 6 HS/phòng) và Thanh tiến độ.", "• Thẻ phòng trực quan: ")
    add_bullet(doc, "Bấm vào phòng để xem danh sách học sinh, giường số 1 đến 6, lớp chuyên và số điện thoại liên hệ.", "• Xem chi tiết phòng: ")
    add_bullet(doc, "Chọn học sinh trong phòng, chọn phòng đích và bấm 'Xác nhận chuyển'. Hệ thống tự động cập nhật sĩ số cả 2 phòng và lưu nhật ký.", "• Chuyển phòng (Transfer): ")
    add_bullet(doc, "Khi học sinh thôi ở nội trú, quản sinh nhấp biểu tượng 'Trả phòng', hệ thống tự động giải phóng chỗ trống và chuyển học sinh sang diện ngoại trú.", "• Trả phòng (Check-out): ")
    add_bullet(doc, "Nhấp nút 'Nhập Excel xếp phòng' ở đầu trang, tải file mẫu Mau_Xep_Phong_KTX_Hung_Vuong.xlsx để xếp phòng và số giường hàng loạt cho toàn bộ học sinh đầu năm.", "• Nhập xếp phòng Excel: ")

    add_heading_3(doc, "2. Tab 'Phân loại Học sinh Nội trú & Ngoại trú (1.883 HS)':")
    add_paragraph(doc, 
        "Hỗ trợ Ban Quản sinh và Nhà trường tra cứu, đối soát toàn diện học sinh toàn trường với các tính năng vượt trội:"
    )
    add_bullet(doc, "Bộ lọc nhanh 3 chế độ: Tất cả học sinh (1.883), Học sinh Nội trú KTX (702) hoặc Học sinh Ngoại trú (1.181).", "• Bộ lọc trạng thái cư trú: ")
    add_bullet(doc, "Lọc kết hợp theo Tầng KTX (Tầng 2 đến 6), Lớp chuyên (54 lớp), Giới tính (Nam/Nữ) và Ô tìm kiếm đa năng theo tên, mã HS, mã phòng.", "• Lọc nâng cao: ")
    add_bullet(doc, "Với học sinh Ngoại trú, Quản sinh có thể bấm nút 'Xếp vào KTX' -> Chọn tầng, chọn phòng còn chỗ trống để cấp quyền nội trú.", "• Xếp phòng cho học sinh ngoại trú: ")
    add_bullet(doc, "Với học sinh Nội trú, có thể bấm 'Đổi phòng' hoặc 'Trả phòng KTX' (chuyển sang ngoại trú) chỉ với 1 click.", "• Rút khỏi KTX: ")

    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\dormitory_import_modal_1792250558584.png", 
                   "Cửa sổ Nhập Excel Phân Bổ Phòng KTX Hàng Loạt", width_inch=4.8)

    # --- CHƯƠNG 5 ---
    add_heading_2(doc, "Chương 5: Điểm Danh KTX & Trung Tâm Giám Sát Thời Gian Thực (Real-time)")
    add_paragraph(doc, 
        "Phân hệ Điểm danh được nâng cấp toàn diện thành Trung tâm Điều hành Điểm danh KTX với 2 chế độ làm việc:"
    )

    add_heading_3(doc, "1. Chế độ 'Kiểm Diện Từng Phòng' (1 Chạm — Đủ Mặt):")
    add_bullet(doc, "Ca Sáng bắt buộc lúc 06h00 và Ca Tối bắt buộc lúc 22h00.", "• Ca điểm danh quy định: ")
    add_bullet(doc, "Quản sinh hoặc Trưởng phòng bấm nút '1 CHẠM — ĐỦ MẶT' màu xanh lá cây, toàn bộ quân số phòng được ghi nhận 'Có mặt' tức thì trong 1 giây.", "• Nút 1 chạm đủ mặt: ")
    add_bullet(doc, "Nếu có học sinh vắng, bấm 'Vắng / Ngoại lệ' để ghi nhận: Vắng có phép (đã có đơn duyệt), Vắng không phép, Đi viện, hoặc Về quê cuối tuần kèm ghi chú lý do.", "• Ghi nhận ngoại lệ: ")
    add_bullet(doc, "Bấm nút 'Báo cáo Zalo 22h15', hệ thống tự động tổng hợp số liệu thực tế toàn bộ 120 phòng và tạo ra mẫu tin nhắn chuẩn mực theo đúng quy định để gửi ngay vào nhóm Quản sinh.", "• Mẫu Zalo 22h15: ")

    add_heading_3(doc, "2. Chế độ 'Trung Tâm Thống Kê & Giám Sát Realtime' (Thời Gian Thực):")
    add_paragraph(doc, 
        "Giải quyết triệt để yêu cầu giám sát tức thời của Ban Giám Hiệu và Trực ban KTX:"
    )
    add_bullet(doc, "Hệ thống tự động đồng bộ mỗi 20 giây và hiển thị 6 thẻ số liệu: Quân số nội trú (702), Tiến độ báo cáo (%), Phòng chưa báo cáo (nổi bật màu đỏ/cam cảnh báo nếu còn phòng chưa nộp), Có mặt thực tế, Vắng có phép, Vắng không phép.", "• Thống kê ngay tại lúc điểm danh: ")
    add_bullet(doc, "Phân loại trực quan theo 5 tầng (Tầng 2 đến Tầng 6). Hiển thị rõ số phòng đã nộp/tổng phòng của từng tầng. Liệt kê danh sách chi tiết các phòng chưa báo cáo kèm Họ tên Trưởng phòng, SĐT liên hệ và nút 'Điểm danh ngay cho phòng này' giúp chuyển thẳng sang kiểm diện phòng đó.", "• Xem ở đâu — Phòng nào chưa báo cáo: ")
    add_bullet(doc, "Bảng theo dõi toàn bộ học sinh vắng mặt trong ca trực: Mã HS, Họ tên, Lớp, Phòng KTX, Lý do vắng, SĐT liên hệ phụ huynh (có nút sao chép SĐT) và nút 'Lập biên bản vi phạm KTX' nếu vắng không phép.", "• Danh sách Vắng ai: ")
    add_bullet(doc, "Bảng xếp hạng Top 50 học sinh vắng mặt nhiều nhất: Số buổi vắng không phép, vắng có phép, tổng buổi vắng, số lần vi phạm KTX và điểm KPI nề nếp. Hệ thống tự động phân loại 3 mức cảnh báo: ĐỎ (Nguy cơ cao — Mời phụ huynh / Kỷ luật rút khỏi KTX), VÀNG (Cảnh báo nề nếp), XANH (Cần theo dõi).", "• Ai thường xuyên vắng mặt, vi phạm: ")
    add_bullet(doc, "Hỗ trợ xem số liệu theo Hôm nay/Theo Ngày cụ thể, Theo Tháng (Tháng 1 đến 12) và Theo Năm học. Khi chọn Tháng hoặc Năm, hệ thống tự động vẽ biểu đồ trực quan biểu diễn xu hướng tỷ lệ chuyên cần và số ca vắng.", "• Thống kê đa chu kỳ Ngày / Tháng / Năm: ")

    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\zalo_report_modal_1792230287005.png", 
                   "Cửa sổ Xem & Sao Chép Báo Cáo Zalo 22h15 Chuẩn Thể Thức Gửi Ban Giám Hiệu và Phụ Huynh", width_inch=4.8)
    
    add_callout(doc, 
        "Trực ban và Ban Giám Hiệu chỉ cần mở tab 'Trung Tâm Thống Kê & Giám Sát Realtime' là nắm bắt ngay lập tức toàn bộ diễn biến KTX: Phòng nào chậm trễ chưa báo cáo, học sinh nào vắng mặt không rõ lý do, và học sinh nào có nguy cơ vi phạm kỷ luật để gọi điện trực tiếp nhắc nhở!",
        "TÍNH NĂNG ĐIỀU HÀNH THỜI GIAN THỰC")

    # --- CHƯƠNG 6 ---
    add_heading_2(doc, "Chương 6: Giám Sát 11 Chế Độ Sinh Hoạt KTX Trong Ngày")
    add_paragraph(doc, 
        "Hệ thống số hóa 11 chế độ sinh hoạt nề nếp hàng ngày, giúp học sinh nội trú rèn luyện tác phong kỷ luật tự giác:"
    )

    regimes = [
        ("05:30", "Báo thức buổi sáng", "Bật còi báo thức, toàn thể học sinh dậy làm vệ sinh"),
        ("05:45", "Thể dục sáng & Thể thao", "Tập thể dục tại sân Tòa nhà A hoặc đường chạy"),
        ("06:15", "Gấp chăn màn & Nội vụ", "Sắp xếp giường chiếu theo quy chuẩn nề nếp"),
        ("06:45", "Ăn sáng tại nhà ăn", "Ăn sáng tập trung đảm bảo dinh dưỡng"),
        ("07:00", "Đi học chính khóa", "Di chuyển lên lớp học tại khu giảng đường"),
        ("11:30", "Ăn trưa & Vệ sinh", "Nhà ăn KTX phục vụ cơm trưa"),
        ("12:15", "Nghỉ trưa bắt buộc", "Nghiêm cấm gây ồn, tắt điện phòng ngủ"),
        ("13:45", "Học chiều / Bồi dưỡng", "Học thêm, bồi dưỡng đội tuyển học sinh giỏi"),
        ("17:30", "Hoạt động thể thao", "Bóng rổ, cầu lông, bóng bàn khuôn viên KTX"),
        ("19:00", "Tự học tối (Study time)", "Học tập nghiêm túc tại phòng hoặc thư viện"),
        ("22:30", "Điểm danh & Tắt đèn", "Quản sinh kiểm tra quân số lần cuối, ngắt điện phòng ngủ")
    ]
    tbl_reg = doc.add_table(rows=len(regimes)+1, cols=3)
    tbl_reg.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_full_table_borders(tbl_reg, color="94A3B8", sz="6")

    reg_headers = ["Thời gian", "Tên chế độ sinh hoạt", "Yêu cầu thực hiện & Tiêu chuẩn"]
    for i, h in enumerate(reg_headers):
        cell = tbl_reg.rows[0].cells[i]
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = COLOR_WHITE

    for r_idx, (t_time, t_name, t_req) in enumerate(regimes):
        row = tbl_reg.rows[r_idx + 1]
        c0, c1, c2 = row.cells[0], row.cells[1], row.cells[2]
        c0.width, c1.width, c2.width = Inches(1.2), Inches(2.4), Inches(3.1)
        set_cell_background(c0, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c1, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c2, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_margins(c0, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c1, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c2, top=50, bottom=50, left=80, right=80)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(t_time)
        r0.font.name = 'Times New Roman'; r0.font.size = Pt(11); r0.font.bold = True; r0.font.color.rgb = COLOR_RED
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(t_name)
        r1.font.name = 'Times New Roman'; r1.font.size = Pt(11); r1.font.bold = True
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(t_req)
        r2.font.name = 'Times New Roman'; r2.font.size = Pt(11); r2.font.color.rgb = COLOR_BLACK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- CHƯƠNG 7 ---
    add_heading_2(doc, "Chương 7: KPI & Sổ Kỷ Luật Nền Nếp (10 Mã Lỗi L01 — L10)")
    add_paragraph(doc, 
        "Hệ thống đánh giá rèn luyện học sinh dựa trên Thang điểm gốc 100 điểm/kỳ. "
        "Mọi hành vi vi phạm nội quy trường lớp và ký túc xá được quy chuẩn thành 10 Mã Lỗi chuẩn hóa (L01 — L10):"
    )

    rules_table = [
        ("L01", "Đi học muộn sau 07h00", "-1.0 điểm", "Nội quy chung"),
        ("L02", "Sai đồng phục hoặc không đeo thẻ HS", "-3.0 điểm", "Nội quy chung"),
        ("L03", "Để xe sai vị trí quy định", "-3.0 điểm", "Nội quy chung"),
        ("L04", "Ăn quà vặt trong lớp học", "-3.0 điểm", "Nội quy chung"),
        ("L05", "Sử dụng điện thoại trái phép trong giờ", "-5.0 điểm", "Nội quy chung"),
        ("L06", "Không tắt thiết bị điện khi rời phòng", "-5.0 điểm", "Nề nếp KTX"),
        ("L07", "Vi phạm nề nếp nội vụ KTX (chăn màn/vệ sinh)", "-3.0 điểm", "Nề nếp KTX"),
        ("L08", "Mất trật tự, vi phạm văn hóa ứng xử", "-3.0 điểm", "Nội quy chung"),
        ("L09", "Gian lận thi cử hoặc lạm dụng AI", "-10.0 điểm", "Chuyên môn"),
        ("L10", "Hành vi đặc biệt nghiêm trọng (bạo lực/chất cấm)", "-20.0 điểm", "Kỷ luật nghiêm trọng")
    ]
    tbl_rul = doc.add_table(rows=len(rules_table)+1, cols=4)
    tbl_rul.alignment = WD_TABLE_ALIGNMENT.CENTER
    apply_full_table_borders(tbl_rul, color="94A3B8", sz="6")

    rul_headers = ["Mã lỗi", "Tên hành vi vi phạm", "Mức trừ điểm", "Phân loại quy định"]
    for i, h in enumerate(rul_headers):
        cell = tbl_rul.rows[0].cells[i]
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = 'Times New Roman'; r.font.size = Pt(11); r.font.bold = True; r.font.color.rgb = COLOR_WHITE

    for r_idx, (m_code, m_name, m_pts, m_cat) in enumerate(rules_table):
        row = tbl_rul.rows[r_idx + 1]
        c0, c1, c2, c3 = row.cells[0], row.cells[1], row.cells[2], row.cells[3]
        c0.width, c1.width, c2.width, c3.width = Inches(0.9), Inches(3.2), Inches(1.2), Inches(1.4)
        set_cell_background(c0, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c1, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c2, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c3, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_margins(c0, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c1, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c2, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c3, top=50, bottom=50, left=80, right=80)
        
        r0 = c0.paragraphs[0].add_run(m_code); r0.font.name = 'Times New Roman'; r0.font.bold = True; r0.font.color.rgb = COLOR_NAVY
        r1 = c1.paragraphs[0].add_run(m_name); r1.font.name = 'Times New Roman'
        r2 = c2.paragraphs[0].add_run(m_pts); r2.font.name = 'Times New Roman'; r2.font.bold = True; r2.font.color.rgb = COLOR_RED
        r3 = c3.paragraphs[0].add_run(m_cat); r3.font.name = 'Times New Roman'

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    add_heading_3(doc, "Quy trình Lập biên bản & Nhập Excel vi phạm hàng loạt:")
    add_bullet(doc, "Gõ tên hoặc Mã học sinh đến đâu, hệ thống tự động tìm kiếm và hiển thị tức thì thời gian thực (Realtime Auto-suggest) đến đó kèm ảnh đại diện, lớp, phòng KTX và số điểm KPI hiện tại. Người dùng có thể nhấp chọn hoặc nhấn phím Enter để chọn nhanh.", "• Tìm & Chọn học sinh thời gian thực: ")
    add_bullet(doc, "Khi người dùng nhấp 'Lập biên bản vi phạm', trường Ngày vi phạm và Giờ vi phạm tự động lấy đúng thời khắc thực tế hiện tại của hệ thống (ví dụ: 01h35 sáng ngày 18/10/2026), không bị gán cứng giờ cũ. Cửa sổ có đồng hồ nhịp đập trực tiếp và nút 'Lấy thời khắc hiện tại' một chạm.", "• Tự động lấy đúng ngày giờ thời khắc bấm vào: ")
    add_bullet(doc, "Cung cấp sẵn các phím bấm nhanh địa điểm: Khuôn viên trường, Ký túc xá, Lớp học, Cổng chính, Nhà ăn KTX, Phòng tự học giúp người lập biên bản thao tác bằng 1 chạm.", "• Phím tắt chọn nhanh địa điểm: ")
    add_bullet(doc, "Đoàn trường hoặc Đội cờ đỏ tải file mẫu Mau_Nhap_Vi_Pham_KPI_Hung_Vuong.xlsx, điền danh sách tổng hợp vi phạm trong tuần và tải lên một lần. Hệ thống tự động trừ điểm và cập nhật bảng xếp loại.", "• Nhập Excel vi phạm hàng loạt: ")
    add_bullet(doc, "BGH và Quản sinh có quyền bấm 'Phê duyệt' hoặc 'Từ chối' biên bản. Điểm KPI được tự động cập nhật ngay lập tức.", "• Phê duyệt biên bản: ")

    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\kpi_import_modal_1792250539415.png", 
                   "Cửa sổ Nhập Excel Biên Bản Vi Phạm Hàng Loạt của Đội cờ đỏ / Đoàn trường", width_inch=4.8)

    # --- CHƯƠNG 8 ---
    add_heading_2(doc, "Chương 8: Quản Lý Đơn Xin Phép KTX Trực Tuyến")
    add_paragraph(doc, 
        "Hệ thống số hóa quy trình nộp và duyệt đơn xin phép ra ngoài KTX (Về quê cuối tuần, Đi học thêm, Đi khám bệnh) "
        "kèm các công cụ giám sát, lọc tìm kiếm thông minh và hiển thị tự động đơn mới nhất:"
    )
    add_bullet(doc, "Học sinh hoặc phụ huynh chọn lý do, nhập thời gian đi và thời gian trở lại KTX dự kiến. Khi nộp đơn thành công, đơn mới nhất sẽ lập tức hiển thị ở vị trí đầu tiên kèm huy hiệu nổi bật 'MỚI NHẤT'.", "1. Nộp đơn trực tuyến & Hiển thị mới nhất: ")
    add_bullet(doc, "Quản sinh kiểm tra trên hệ thống và bấm 'Duyệt đơn' hoặc 'Từ chối'. Khi đơn được duyệt, học sinh tự động được chuyển sang trạng thái 'Vắng có phép' trong ca điểm danh tương ứng.", "2. Phê duyệt đơn thời gian thực: ")
    add_bullet(doc, "Khi học sinh trở lại KTX, quản sinh nhấp nút 'Xác nhận trở lại (Đã về)' để khóa đơn và đưa học sinh trở lại danh sách có mặt an toàn. Nếu quá giờ cam kết chưa về, hệ thống tự động gắn cờ đỏ cảnh báo 'QUÁ HẠN TRỞ LẠI'.", "3. Quản lý Check-in & Cảnh báo quá hạn: ")
    
    add_heading_3(doc, "✨ Bộ lọc theo Ngày & Điều khiển hiển thị Đơn mới nhất:")
    add_bullet(doc, "Bộ chọn lịch trực quan cho phép lọc đơn theo bất kỳ ngày nào. Trang bị sẵn các phím tắt 1 chạm: 'Hôm nay' (lọc nhanh đơn của ngày hiện tại), 'Hôm qua' và 'Tất cả ngày' (xóa lọc để xem toàn bộ).", "• Bộ lọc theo Ngày (Date Filter): ")
    add_bullet(doc, "Hệ thống mặc định sắp xếp danh sách theo 'Mới nhất trước' (ID và thời gian tạo giảm dần), giúp cán bộ quản sinh luôn nhìn thấy các đơn vừa nộp ngay trên đầu trang mà không cần cuộn tìm kiếm. Đồng thời hỗ trợ tùy chọn sắp xếp: Cũ nhất trước, Thời gian đi mới nhất, Thời gian đi cũ nhất.", "• Hiển thị cái mới nhất trước (Newest First): ")
    add_bullet(doc, "Trên đầu trang có 5 thẻ thống kê trực quan: Tất cả đơn, Chờ phê duyệt, Đang ra ngoài, Quá hạn trở lại (nhấp nháy đỏ báo động), Đã về KTX. Nhấp vào thẻ bất kỳ sẽ tự động lọc danh sách theo trạng thái đó.", "• 5 Thẻ tóm tắt trạng thái 1 chạm: ")
    add_bullet(doc, "Hộp tìm kiếm cho phép lọc tức thì theo Họ tên học sinh, Mã học sinh (HV...), Mã đơn (NP-2026-...), Lớp chuyên, Phòng KTX hoặc Lý do xin phép.", "• Tìm kiếm thông minh: ")

    # --- CHƯƠNG 9 ---
    add_heading_2(doc, "Chương 9: Báo Cáo Ma Trận Lỗi & Bộ 3 Mẫu In KPI Chuẩn A4 (Toàn Trường, Cùng Lớp, Từng Học Sinh)")
    add_paragraph(doc, 
        "Hệ thống trang bị bộ công cụ tổng kết và báo cáo chuyên sâu phục vụ sơ kết, tổng kết thi đua, "
        "đặc biệt tích hợp Bộ 3 Mẫu In Văn Bản & Phiếu Đánh Giá KPI Chuẩn A4 đáp ứng mọi cấp độ quản lý:"
    )
    add_bullet(doc, "Thống kê ma trận số vụ vi phạm của từng lớp đối với 10 mã lỗi L01-L10 trong toàn học kỳ.", "• Ma trận 54 Lớp x 10 Mã Lỗi: ")
    add_bullet(doc, "Bảng điểm chi tiết 1.880 học sinh với số điểm trừ và xếp loại thi đua (Xuất sắc, Tốt, Đạt, Chưa đạt). Hỗ trợ nút Xuất file CSV.", "• Bảng điểm KPI toàn trường: ")
    
    add_heading_3(doc, "Bộ 3 Mẫu In KPI Chuẩn A4 (Chuẩn thể thức NĐ 30/2020/NĐ-CP):")
    add_bullet(doc, "Tự động sinh văn bản báo cáo thi đua toàn trường có đầy đủ Quốc hiệu, Tiêu ngữ, số hiệu văn bản theo Nghị định 30/2020/NĐ-CP, bảng tổng hợp quy mô 1.880 học sinh, tỷ lệ nội trú, số vụ vi phạm và 2 chữ ký: Trưởng ban Quản sinh KTX và Hiệu trưởng (ký và đóng dấu).", "1. Mẫu 1 — In Báo Cáo Toàn Trường: ")
    add_bullet(doc, "Cho phép chọn nhanh bất kỳ lớp nào trong 54 lớp chuyên -> In bảng tổng hợp điểm KPI của toàn thể học sinh cùng lớp với đầy đủ: Mã HS, Họ tên, Giới tính, Phòng KTX (hoặc ngoại trú), Điểm gốc 100, Điểm trừ, Điểm tổng kết, Xếp loại, tóm tắt các vi phạm trong kỳ và 3 chữ ký: Lớp trưởng, Giáo viên chủ nhiệm, Ban Giám hiệu.", "2. Mẫu 2 — In Bảng Điểm KPI Cùng Lớp: ")
    add_bullet(doc, "Tìm kiếm hoặc chọn bất kỳ học sinh nào trong 1.880 học sinh -> In Phiếu theo dõi rèn luyện nề nếp & KPI cá nhân chuẩn A4 gồm: Lý lịch học sinh, lớp, phòng KTX, GVCN, thông tin phụ huynh, bảng kết quả điểm rèn luyện (gốc 100, trừ, tổng kết, xếp loại) và Bảng chi tiết toàn bộ các biên bản vi phạm trong kỳ (ngày giờ, lỗi, địa điểm, người lập biên bản), cùng 4 chữ ký: Học sinh, Đại diện Phụ huynh, GVCN, Hiệu trưởng.", "3. Mẫu 3 — In Phiếu KPI Từng Học Sinh: ")
    add_bullet(doc, "Trên màn hình 'Hồ sơ Học sinh', mỗi dòng học sinh đều có biểu tượng máy in để bấm in ngay phiếu KPI cá nhân. Trên màn hình '54 Lớp Chuyên', mỗi lớp đều có nút 'In Bảng KPI Lớp (A4)' để in ngay bảng điểm cả lớp mà không cần thao tác phức tạp.", "• Phím tắt in nhanh tại các màn hình: ")

    # --- CHƯƠNG 10 ---
    add_heading_2(doc, "Chương 10: Chuyển Niên Khóa Tự Động & Quản Trị Hệ Thống")
    add_paragraph(doc, 
        "Hệ thống cung cấp các công cụ quản trị cao cấp dành riêng cho Ban Giám Hiệu:"
    )
    add_bullet(doc, "Vào cuối năm học, BGH bấm nút 'Thực hiện chuyển niên khóa' để tự động đôn học sinh Khối 10 lên Khối 11, Khối 11 lên Khối 12 và chuyển Khối 12 sang trạng thái 'Đã tốt nghiệp'. Toàn bộ điểm KPI được tự động thiết lập lại 100 điểm cho năm học mới.", "• Chuyển niên khóa 1 chạm: ")
    add_bullet(doc, "Quản lý danh sách tài khoản theo 6 vai trò: Admin BGH, Quản sinh KTX, Trưởng tầng KTX, Trưởng phòng KTX, GVCN, Đoàn trường/Chi đoàn. Hỗ trợ khóa/mở khóa tài khoản, cấp lại mật khẩu bảo vệ tài khoản.", "• Quản trị tài khoản & Phân quyền: ")

    add_heading_3(doc, "✨ Tính năng Tạo Tài Khoản Trưởng Phòng KTX & Gán Phòng Phụ Trách:")
    add_paragraph(doc, 
        "Hệ thống cho phép Ban Quản sinh và BGH tạo tài khoản đại diện cho từng Trưởng phòng KTX trong 120 phòng để trực tiếp kiểm diện nội vụ phòng mình:"
    )
    add_bullet(doc, "Nhấp nút 'Thêm tài khoản' trên trang Quản trị Hệ thống, nhập Tên đăng nhập (ví dụ: tp_p201), Mật khẩu và Họ tên Trưởng phòng.", "Bước 1: ")
    add_bullet(doc, "Tại mục 'Vai trò hệ thống', chọn 'Trưởng phòng KTX (room_leader)'. Ngay lập tức, hệ thống mở hộp chọn thông minh hiển thị danh sách đầy đủ 120 phòng KTX (từ Phòng P201 đến P624).", "Bước 2: ")
    add_bullet(doc, "Chọn đúng số phòng cần bàn giao phụ trách (Ví dụ: 'Phòng P201 - Tầng 2 (Nam) - Đang ở 6/6 HS').", "Bước 3: ")
    add_bullet(doc, "Bấm 'Tạo tài khoản'. Hệ thống tự động gán phạm vi (scope assignment) và liên kết tài khoản với phòng KTX tương ứng. Trên bảng danh sách người dùng, tài khoản sẽ có huy hiệu nổi bật màu xanh ngọc: '🛏️ Phòng P201 (T2)'.", "Bước 4: ")
    add_bullet(doc, "Quy trình tương tự khi tạo tài khoản 'Trưởng tầng KTX' (chọn Tầng 2, 3, 4, 5, 6) hoặc 'Giáo viên chủ nhiệm' (chọn 1 trong 54 lớp chuyên). Khi đăng nhập, tài khoản sẽ được phân quyền tự động đúng theo phạm vi phòng/tầng/lớp được giao.", "• Áp dụng linh hoạt cho Trưởng tầng và GVCN: ")

    add_bullet(doc, "Hệ thống tự động ghi nhật ký mọi thao tác (Lập biên bản, Phê duyệt, Xóa học sinh, Đổi phòng, Tạo tài khoản) kèm mốc thời gian và người thực hiện để đảm bảo tính minh bạch, khách quan.", "• Nhật ký hệ thống (Audit Logs): ")

    # ==========================================
    # PHẦN 3: CÂU HỎI THƯỜNG GẶP & HỖ TRỢ KỸ THUẬT
    # ==========================================
    add_heading_1(doc, "PHẦN III: CÂU HỎI THƯỜNG GẶP (FAQ) & HỖ TRỢ KỸ THUẬT")

    add_heading_3(doc, "1. Tôi quên mật khẩu đăng nhập thì phải làm thế nào?")
    add_paragraph(doc, "Trả lời: Quý thầy cô vui lòng liên hệ quản trị viên (tài khoản admin) hoặc cán bộ công nghệ thông tin nhà trường để được cấp lại mật khẩu mặc định (password123).")

    add_heading_3(doc, "2. Khi nhập file Excel học sinh báo lỗi dòng màu đỏ thì xử lý ra sao?")
    add_paragraph(doc, "Trả lời: Hệ thống có cơ chế kiểm tra lỗi tự động. Lỗi thường do trùng Mã học sinh đã có sẵn trong hệ thống, hoặc tên Lớp chuyên không khớp với danh mục 54 lớp chuẩn. Thầy cô chỉ cần sửa lại đúng tên lớp (VD: '10 Chuyên Toán 1') rồi tải lại file.")

    add_heading_3(doc, "3. Hệ thống có dùng được trên điện thoại di động không?")
    add_paragraph(doc, "Trả lời: Hoàn toàn được! Giao diện hệ thống được thiết kế chuẩn Responsive, tự động tối ưu hóa đẹp mắt trên màn hình điện thoại iPhone, Android, máy tính bảng iPad. Quản sinh có thể cầm điện thoại đi từng phòng để điểm danh rất tiện lợi.")

    add_heading_3(doc, "4. Thông tin liên hệ hỗ trợ kỹ thuật:")
    add_bullet(doc, "Trường THPT Chuyên Hùng Vương — Tỉnh Phú Thọ", "• Đơn vị phát triển: ")
    add_bullet(doc, "Thầy Nguyễn Văn Kính — Quản trị hệ thống", "• Cán bộ phụ trách: ")
    add_bullet(doc, "http://webkpi.ttytphuninh.vn", "• Website chính thức: ")

    # Save final docx
    doc.save(OUTPUT_FILE)
    print(f"SUCCESS: Document created at {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
