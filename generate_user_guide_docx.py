# -*- coding: utf-8 -*-
"""
Script to generate a comprehensive, professional Word User Guide (.docx)
for "Hệ Thống Quản Lý KTX & KPI Rèn Luyện Nền Nếp — THPT Chuyên Hùng Vương".
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_PATH = r"c:\source code\ThayKinhKPI\Huong_Dan_Su_Dung_He_Thong_KTX_KPI_Chuyen_Hung_Vuong.docx"

# Color Palette
COLOR_NAVY = RGBColor(14, 58, 124)     # #0E3A7C (Chuyên Hùng Vương Navy)
COLOR_RED = RGBColor(211, 32, 39)      # #D32027 (Heritage Crimson)
COLOR_GOLD = RGBColor(180, 83, 9)      # #B45309 (Gold Accent)
COLOR_DARK = RGBColor(30, 41, 59)      # #1E293B (Slate 800)
COLOR_MUTED = RGBColor(100, 116, 139)  # #64748B (Slate 500)

HEX_NAVY = "0E3A7C"
HEX_LIGHT_BLUE = "F0F4FA"
HEX_LIGHT_GRAY = "F8FAFC"
HEX_BORDER = "CBD5E1"
HEX_RED = "D32027"

def set_cell_background(cell, hex_color):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
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
    h.paragraph_format.space_before = Pt(16)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(15)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return h

def add_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(12.5)
    run.font.bold = True
    run.font.color.rgb = COLOR_RED
    return h

def add_heading_3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(8)
    h.paragraph_format.space_after = Pt(2)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = COLOR_DARK
    return h

def add_paragraph(doc, text, bold_prefix=None, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Calibri'
        r_pre.font.size = Pt(10.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_DARK
    r = p.add_run(text)
    r.font.name = 'Calibri'
    r.font.size = Pt(10.5)
    r.font.color.rgb = COLOR_DARK
    return p

def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Calibri'
        r_pre.font.size = Pt(10.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_DARK
    r = p.add_run(text)
    r.font.name = 'Calibri'
    r.font.size = Pt(10.5)
    r.font.color.rgb = COLOR_DARK
    return p

def add_callout(doc, text, title="LƯU Ý QUAN TRỌNG:", hex_bg=HEX_LIGHT_BLUE, hex_border=HEX_NAVY):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, hex_bg)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    # Left border styling
    tcPr = cell._tc.get_or_add_tcPr()
    borders_xml = f'''
    <w:tcBorders {nsdecls("w")}>
        <w:top w:val="none"/>
        <w:left w:val="single" w:sz="36" w:space="0" w:color="{hex_border}"/>
        <w:bottom w:val="none"/>
        <w:right w:val="none"/>
    </w:tcBorders>
    '''
    tcPr.append(parse_xml(borders_xml))

    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r_title = p.add_run(f"📌 {title} ")
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(10)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_NAVY
    
    r_text = p.add_run(text)
    r_text.font.name = 'Calibri'
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = COLOR_DARK
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_image_safe(doc, image_path, caption=None, width_inch=5.8):
    if os.path.exists(image_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run()
        run.add_picture(image_path, width=Inches(width_inch))
        
        if caption:
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(8)
            r_cap = p_cap.add_run(f"Hình: {caption}")
            r_cap.font.name = 'Calibri'
            r_cap.font.size = Pt(9)
            r_cap.font.italic = True
            r_cap.font.color.rgb = COLOR_MUTED

def main():
    doc = docx.Document()

    # Page Margins (2cm = 0.79 inch)
    sections = doc.sections
    for section in sections:
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
    r1.font.name = 'Calibri'
    r1.font.size = Pt(11)
    r1.font.bold = True
    r1.font.color.rgb = COLOR_MUTED
    
    r2 = p_header.add_run("TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG\n")
    r2.font.name = 'Calibri'
    r2.font.size = Pt(13)
    r2.font.bold = True
    r2.font.color.rgb = COLOR_NAVY
    
    r3 = p_header.add_run("-----------------------o0o-----------------------")
    r3.font.name = 'Calibri'
    r3.font.size = Pt(10)
    r3.font.color.rgb = COLOR_MUTED

    logo_path = r"c:\source code\ThayKinhKPI\frontend\public\logo.png"
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(18)
        p_logo.paragraph_format.space_after = Pt(18)
        p_logo.add_run().add_picture(logo_path, width=Inches(1.8))

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(6)
    r_t1 = p_title.add_run("TÀI LIỆU HƯỚNG DẪN SỬ DỤNG\n")
    r_t1.font.name = 'Calibri'
    r_t1.font.size = Pt(20)
    r_t1.font.bold = True
    r_t1.font.color.rgb = COLOR_RED

    r_t2 = p_title.add_run("HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ & KPI RÈN LUYỆN NỀN NẾP\n")
    r_t2.font.name = 'Calibri'
    r_t2.font.size = Pt(16)
    r_t2.font.bold = True
    r_t2.font.color.rgb = COLOR_NAVY

    r_t3 = p_title.add_run("(Áp dụng cho Năm học 2026 – 2027)")
    r_t3.font.name = 'Calibri'
    r_t3.font.size = Pt(12)
    r_t3.font.italic = True
    r_t3.font.color.rgb = COLOR_MUTED

    # Meta Table
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    tbl_meta = doc.add_table(rows=6, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_info = [
        ("Cơ quan chủ quản:", "Trường THPT Chuyên Hùng Vương — Phú Thọ"),
        ("Hệ thống phần mềm:", "Cổng thông tin Quản lý KTX & KPI Nền nếp Học sinh"),
        ("Địa chỉ Web truy cập:", "http://webkpi.ttytphuninh.vn (hoặc http://localhost:5288)"),
        ("Đối tượng sử dụng:", "BGH, Quản sinh KTX, GVCN, Trưởng tầng/phòng, Đoàn trường"),
        ("Quy mô quản lý:", "1.880 Học sinh • 54 Lớp Chuyên • 120 Phòng KTX • 10 Mã Lỗi L01-L10"),
        ("Phiên bản phát hành:", "Version 2.0 (Bản hoàn chỉnh — Tích hợp Nhập/Xuất Excel)")
    ]
    for idx, (label, val) in enumerate(meta_info):
        row = tbl_meta.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.2)
        set_cell_background(c0, HEX_LIGHT_BLUE if idx % 2 == 0 else "FFFFFF")
        set_cell_background(c1, HEX_LIGHT_BLUE if idx % 2 == 0 else "FFFFFF")
        set_cell_margins(c0, top=60, bottom=60, left=100, right=100)
        set_cell_margins(c1, top=60, bottom=60, left=100, right=100)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(label)
        r0.font.name = 'Calibri'
        r0.font.size = Pt(10)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_NAVY
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.name = 'Calibri'
        r1.font.size = Pt(10)
        r1.font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # ==========================================
    # PHẦN 1: TỔNG QUAN HỆ THỐNG & TÀI KHOẢN TRUY CẬP
    # ==========================================
    add_heading_1(doc, "PHẦN I: GIỚI THIỆU CHUNG & THÔNG TIN TRUY CẬP")
    add_paragraph(doc, 
        "Hệ thống Quản lý Ký túc xá & KPI Rèn luyện Nền nếp trường THPT Chuyên Hùng Vương là giải pháp chuyển đổi số toàn diện "
        "được xây dựng riêng biệt theo đặc thù của trường chuyên trọng điểm. Hệ thống số hóa 100% công tác theo dõi 1.880 học sinh, "
        "54 lớp chuyên chất lượng cao, 120 phòng ký túc xá (699 học sinh nội trú), 11 chế độ sinh hoạt trong ngày và ma trận kỷ luật "
        "thang điểm gốc 100 điểm với 10 mã lỗi hành vi chuẩn hóa (L01 — L10)."
    )

    add_heading_2(doc, "1.1. Địa chỉ truy cập hệ thống")
    add_bullet(doc, "http://webkpi.ttytphuninh.vn (Truy cập từ bất kỳ thiết bị có kết nối Internet: Máy tính, Điện thoại, iPad)", "• Tên miền trực tuyến: ")
    add_bullet(doc, "http://localhost:5288 (Khi làm việc nội bộ trên máy chủ nhà trường)", "• Địa chỉ cục bộ: ")

    add_heading_2(doc, "1.2. Danh sách tài khoản thử nghiệm theo vai trò (Roles)")
    add_paragraph(doc, "Hệ thống hỗ trợ cơ chế phân quyền bảo mật 6 cấp bậc chặt chẽ. Quý khách và thầy cô có thể dùng các tài khoản dưới đây để trải nghiệm:")

    tbl_acc = doc.add_table(rows=5, cols=4)
    tbl_acc.alignment = WD_TABLE_ALIGNMENT.CENTER
    acc_headers = ["Tên đăng nhập", "Mật khẩu", "Vai trò (Role)", "Quyền hạn chính"]
    for i, h in enumerate(acc_headers):
        cell = tbl_acc.rows[0].cells[i]
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = 'Calibri'
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    acc_data = [
        ("admin", "password123", "Ban Giám Hiệu / Quản trị", "Toàn quyền hệ thống: Cấu hình, Duyệt kỷ luật, Chuyển năm học, In văn bản A4"),
        ("manager", "password123", "Quản sinh KTX", "Quản lý 120 phòng, Xếp phòng, Duyệt đơn xin phép, Báo cáo Zalo 22h15, Điểm danh"),
        ("leader", "password123", "Trưởng tầng KTX", "Điểm danh phòng theo tầng phụ trách, Báo cáo sĩ số ca sáng/tối"),
        ("teacher", "password123", "Giáo viên chủ nhiệm", "Theo dõi điểm KPI, sĩ số nội trú lớp mình, tra cứu vi phạm của học sinh")
    ]

    for row_idx, row_data in enumerate(acc_data):
        row = tbl_acc.rows[row_idx + 1]
        for col_idx, text in enumerate(row_data):
            cell = row.cells[col_idx]
            set_cell_background(cell, HEX_LIGHT_GRAY if row_idx % 2 == 0 else "FFFFFF")
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.name = 'Calibri'
            r.font.size = Pt(9.5)
            if col_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_NAVY
            else:
                r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ==========================================
    # PHẦN 2: HƯỚNG DẪN CHI TIẾT TỪNG PHÂN HỆ
    # ==========================================
    add_heading_1(doc, "PHẦN II: HƯỚNG DẪN SỬ DỤNG CHI TIẾT CÁC CHỨC NĂNG")

    # --- CHƯƠNG 1 ---
    add_heading_2(doc, "Chương 1: Đăng nhập & Bàn làm việc Tổng quan (Dashboard)")
    add_paragraph(doc, 
        "Sau khi truy cập vào hệ thống, giao diện đăng nhập bảo mật của trường THPT Chuyên Hùng Vương sẽ hiển thị. "
        "Nhập Tên đăng nhập và Mật khẩu, sau đó bấm nút 'Đăng nhập vào hệ thống'."
    )
    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\login_page_1792230152224.png", 
                   "Màn hình đăng nhập hệ thống THPT Chuyên Hùng Vương", width_inch=4.5)

    add_paragraph(doc, "Ngay sau khi đăng nhập thành công, Dashboard Tổng quan sẽ cung cấp bức tranh toàn cảnh về nề nếp và ký túc xá:")
    add_bullet(doc, "Tổng học sinh toàn trường (1.880 HS), Học sinh nội trú (699 HS - 335 Nam / 364 Nữ), Điểm KPI trung bình (99.9đ), Tỷ lệ chuyên cần KTX (94.8%).", "• 4 Thẻ chỉ số chủ chốt (Stat Cards): ")
    add_bullet(doc, "Phòng KTX đang sử dụng (120/120 phòng), Vi phạm hôm nay, Đơn xin phép chờ duyệt, Số phòng chưa hoàn tất báo cáo.", "• 4 Thẻ tác nghiệp nhanh: ")
    add_bullet(doc, "Quy mô học sinh theo Khối lớp (Khối 10, 11, 12) và Tỷ lệ học sinh Nội trú / Ngoại trú.", "• Biểu đồ hàng 1: ")
    add_bullet(doc, "Phân bố vi phạm theo 10 Mã lỗi (L01 — L10) và Thanh công suất lấp đầy KTX từng tầng (Tầng 2 đến Tầng 6).", "• Biểu đồ hàng 2: ")
    add_bullet(doc, "Top 5 Lớp dẫn đầu thi đua KPI và Danh sách các lớp cần tập trung chấn chỉnh nề nếp trong tuần.", "• 2 Bảng xếp hạng: ")

    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\dashboard_charts_upper_1792236559767.png", 
                   "Giao diện Dashboard Tổng quan — Thẻ thống kê & Biểu đồ khối lớp, nội trú", width_inch=5.8)
    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\dashboard_charts_lower_1792236553539.png", 
                   "Giao diện Phân bố Vi phạm 10 Mã Lỗi L01-L10 & Xếp hạng thi đua các lớp", width_inch=5.8)

    # --- CHƯƠNG 2 ---
    add_heading_2(doc, "Chương 2: Quản lý Hồ sơ Học sinh & Nhập/Xuất File Excel")
    add_paragraph(doc, 
        "Hệ thống lưu trữ và quản lý chi tiết hồ sơ 1.880 học sinh trường THPT Chuyên Hùng Vương. Người dùng có thể dễ dàng "
        "tìm kiếm, lọc theo Khối, Lớp, Giới tính, Diện Nội trú/Ngoại trú."
    )
    add_heading_3(doc, "Các thao tác chính trên trang Hồ sơ Học sinh:")
    add_bullet(doc, "Gõ mã học sinh (VD: HV100018), họ tên hoặc quê quán vào ô tìm kiếm và ấn Enter.", "1. Tìm kiếm nhanh: ")
    add_bullet(doc, "Bấm nút 'Thêm học sinh', điền đầy đủ Mã HS, Họ tên, Lớp chuyên, Ngày sinh, Giới tính, Quê quán, SĐT phụ huynh và ấn Lưu.", "2. Thêm mới học sinh: ")
    add_bullet(doc, "Bấm biểu tượng 'Con mắt' trên từng dòng để xem lịch sử vi phạm, phòng KTX, điểm KPI và thông tin gia đình.", "3. Xem chi tiết hồ sơ: ")
    add_bullet(doc, "Bấm nút 'Xuất CSV Excel' ở đầu trang để tải về toàn bộ danh sách 1.880 học sinh kèm số điểm KPI hiện tại.", "4. Xuất dữ liệu: ")

    add_heading_3(doc, "✨ Tính năng ĐỘC QUYỀN: Nhập Danh Sách Học Sinh Từ File Excel (.xlsx / .csv):")
    add_paragraph(doc, 
        "Để tiết kiệm thời gian nhập liệu đầu năm học, hệ thống hỗ trợ tính năng Import file Excel cực kỳ mạnh mẽ:"
    )
    add_bullet(doc, "Bấm nút 'Nhập dữ liệu' ở thanh công cụ đầu trang.", "• Bước 1: ")
    add_bullet(doc, "Trong cửa sổ hiện lên, bấm nút 'Tải file Excel mẫu' để tải về file Mau_Nhap_Hoc_Sinh_Chuyen_Hung_Vuong.xlsx chuẩn định dạng.", "• Bước 2: ")
    add_bullet(doc, "Mở file Excel vừa tải, điền danh sách học sinh theo các cột mẫu: Mã học sinh, Họ và tên, Lớp chuyên, Giới tính, Ngày sinh, Nội trú (Có/Không), SĐT phụ huynh, Quê quán.", "• Bước 3: ")
    add_bullet(doc, "Kéo thả file Excel vào khung tải lên hoặc nhấp chuột để chọn file từ máy tính. Hệ thống tự động phân tích và hiển thị bảng xem trước (Preview) 5 dòng đầu.", "• Bước 4: ")
    add_bullet(doc, "Bấm 'Xác nhận nhập dữ liệu'. Hệ thống tự động kiểm tra trùng mã, chuẩn hóa ngày sinh và gán học sinh vào 54 lớp chuyên.", "• Bước 5: ")

    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\student_import_modal_1792250520428.png", 
                   "Cửa sổ Nhập Danh Sách Học Sinh Hàng Loạt Từ File Excel với tính năng Tải file mẫu và Preview", width_inch=4.8)

    # --- CHƯƠNG 3 ---
    add_heading_2(doc, "Chương 3: Quản lý 54 Lớp Chuyên Chất Lượng Cao")
    add_paragraph(doc, 
        "Hệ thống số hóa danh mục 54 lớp chuyên thuộc 3 khối: Khối 10 (17 lớp), Khối 11 (17 lớp) và Khối 12 (20 lớp) "
        "bao gồm các môn chuyên Toán, Tin, Lý, Hóa, Sinh, Văn, Sử, Địa, Tiếng Anh, Tiếng Pháp, Tiếng Nga, Tiếng Trung."
    )
    add_bullet(doc, "Mỗi thẻ lớp học hiển thị rõ tên GVCN, Sĩ số lớp (chuẩn 35 HS/lớp), Số học sinh nội trú và Điểm KPI thi đua trung bình của lớp.", "• Thông tin thẻ lớp: ")
    add_bullet(doc, "Lọc nhanh danh sách theo khối bằng cách chọn các tab: Tất cả (54), Khối 10, Khối 11, Khối 12.", "• Lọc theo khối: ")
    add_bullet(doc, "Nhấp vào tên lớp để xem toàn bộ danh sách học sinh thuộc lớp đó kèm xếp loại KPI từng em.", "• Xem danh sách học sinh của lớp: ")

    # --- CHƯƠNG 4 ---
    add_heading_2(doc, "Chương 4: Sơ Đồ Trực Quan Ký Túc Xá & Xếp Phòng (120 Phòng)")
    add_paragraph(doc, 
        "Khu Ký túc xá trường THPT Chuyên Hùng Vương gồm 120 phòng trải dài từ Tầng 2 đến Tầng 6, phục vụ 699 học sinh nội trú:"
    )
    add_bullet(doc, "24 phòng/tầng, phục vụ học sinh nam nội trú.", "• Tầng 2 & Tầng 3 (Khu Nam): ")
    add_bullet(doc, "24 phòng, phân chia cánh Nam và cánh Nữ riêng biệt.", "• Tầng 4 (Hỗn hợp): ")
    add_bullet(doc, "24 phòng/tầng, phục vụ toàn bộ học sinh nữ nội trú.", "• Tầng 5 & Tầng 6 (Khu Nữ): ")

    add_heading_3(doc, "Thao tác quản lý phòng KTX:")
    add_bullet(doc, "Bấm vào thẻ bất kỳ (VD: P201) để xem danh sách 6 học sinh đang ở, số giường, lớp và số điện thoại liên hệ.", "• Xem danh sách phòng: ")
    add_bullet(doc, "Chọn học sinh, chọn phòng mới cần chuyển đến và bấm 'Xác nhận chuyển'. Hệ thống tự động cập nhật sĩ số cả 2 phòng.", "• Chuyển phòng (Transfer): ")
    add_bullet(doc, "Bấm biểu tượng 'Trả phòng' cạnh tên học sinh khi học sinh chuyển sang diện ngoại trú.", "• Trả phòng (Check-out): ")
    add_bullet(doc, "Bấm nút 'Nhập Excel xếp phòng' ở đầu trang, tải file mẫu Mau_Xep_Phong_KTX_Hung_Vuong.xlsx để gán hàng loạt học sinh vào phòng và giường.", "• Nhập xếp phòng hàng loạt: ")

    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\dormitory_import_modal_1792250558584.png", 
                   "Cửa sổ Nhập Excel Phân Bổ Phòng KTX Hàng Loạt", width_inch=4.8)

    # --- CHƯƠNG 5 ---
    add_heading_2(doc, "Chương 5: Điểm Danh KTX & Tự Động Xuất Báo Cáo Zalo 22h15")
    add_paragraph(doc, 
        "Mỗi ngày quản sinh và ban tự quản KTX thực hiện 2 ca điểm danh bắt buộc: Ca Sáng lúc 06h00 và Ca Tối lúc 22h00."
    )
    add_bullet(doc, "Tại mỗi phòng, quản sinh có thể bấm 'Tất cả có mặt' chỉ với 1 cú nhấp chuột để hoàn thành điểm danh nhanh.", "• Điểm danh 1 chạm: ")
    add_bullet(doc, "Nếu có học sinh vắng, nhấp vào tên học sinh để chọn: Vắng có phép (đã có đơn duyệt), Vắng không phép, hoặc Đi viện.", "• Ghi nhận vắng: ")

    add_heading_3(doc, "✨ Tính năng ĐỘT PHÁ: Tự Động Tạo Mẫu Tin Nhắn Báo Cáo Zalo (Mốc 22h15):")
    add_paragraph(doc, 
        "Đúng 22h15 mỗi tối, quản sinh chỉ cần bấm nút 'Báo cáo Zalo 22h15'. Hệ thống sẽ tự động tổng hợp số liệu "
        "và sinh ra đoạn tin nhắn chuẩn mực theo đúng quy định của nhà trường:"
    )
    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\zalo_report_modal_1792230287005.png", 
                   "Cửa sổ Xem & Sao Chép Báo Cáo Zalo 22h15 Chuẩn Văn Phong Gửi BGH và Phụ Huynh", width_inch=4.8)
    add_callout(doc, 
        "Bấm nút 'Sao chép nội dung', sau đó mở nhóm Zalo 'Ban Quản Nhiệm KTX Hùng Vương' và dán (Ctrl + V) để gửi báo cáo tức thì mà không cần gõ tay!",
        "MẸO TÁC NGHIỆP NHANH")

    # --- CHƯƠNG 6 ---
    add_heading_2(doc, "Chương 6: 11 Chế Độ Sinh Hoạt KTX Trong Ngày")
    add_paragraph(doc, 
        "Hệ thống số hóa 11 chế độ sinh hoạt nề nếp hàng ngày của học sinh nội trú:"
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
    reg_headers = ["Thời gian", "Tên chế độ sinh hoạt", "Yêu cầu thực hiện"]
    for i, h in enumerate(reg_headers):
        cell = tbl_reg.rows[0].cells[i]
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = 'Calibri'
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, (t_time, t_name, t_req) in enumerate(regimes):
        row = tbl_reg.rows[r_idx + 1]
        c0, c1, c2 = row.cells[0], row.cells[1], row.cells[2]
        c0.width, c1.width, c2.width = Inches(1.2), Inches(2.3), Inches(2.9)
        set_cell_background(c0, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c1, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c2, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(t_time)
        r0.font.name = 'Calibri'; r0.font.size = Pt(9); r0.font.bold = True; r0.font.color.rgb = COLOR_RED
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(t_name)
        r1.font.name = 'Calibri'; r1.font.size = Pt(9); r1.font.bold = True
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(t_req)
        r2.font.name = 'Calibri'; r2.font.size = Pt(9); r2.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- CHƯƠNG 7 ---
    add_heading_2(doc, "Chương 7: KPI & Sổ Kỷ Luật Nền Nếp (10 Mã Lỗi L01 — L10)")
    add_paragraph(doc, 
        "Hệ thống vận hành theo cơ chế Điểm gốc 100 điểm/kỳ. Khi học sinh vi phạm các lỗi nề nếp, "
        "hệ thống sẽ tự động trừ điểm theo biểu quy định 10 Mã Lỗi đã ban hành:"
    )
    
    rules_table = [
        ("L01", "Đi học muộn sau 07h00", "-1.0 điểm", "Chung"),
        ("L02", "Sai đồng phục hoặc không đeo thẻ HS", "-3.0 điểm", "Chung"),
        ("L03", "Để xe sai vị trí quy định", "-3.0 điểm", "Chung"),
        ("L04", "Ăn quà vặt trong lớp học", "-3.0 điểm", "Chung"),
        ("L05", "Sử dụng điện thoại trái phép trong giờ", "-5.0 điểm", "Chung"),
        ("L06", "Không tắt thiết bị điện khi rời phòng", "-5.0 điểm", "KTX"),
        ("L07", "Vi phạm nề nếp nội vụ KTX (chăn màn/vệ sinh)", "-3.0 điểm", "KTX"),
        ("L08", "Mất trật tự, vi phạm văn hóa ứng xử", "-3.0 điểm", "Chung"),
        ("L09", "Gian lận thi cử hoặc lạm dụng AI", "-10.0 điểm", "Chung"),
        ("L10", "Hành vi đặc biệt nghiêm trọng (bạo lực/chất cấm)", "-20.0 điểm", "Nghiêm trọng")
    ]
    tbl_rul = doc.add_table(rows=len(rules_table)+1, cols=4)
    tbl_rul.alignment = WD_TABLE_ALIGNMENT.CENTER
    rul_headers = ["Mã lỗi", "Tên hành vi vi phạm", "Mức trừ điểm", "Phân loại"]
    for i, h in enumerate(rul_headers):
        cell = tbl_rul.rows[0].cells[i]
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = 'Calibri'; r.font.size = Pt(9.5); r.font.bold = True; r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, (m_code, m_name, m_pts, m_cat) in enumerate(rules_table):
        row = tbl_rul.rows[r_idx + 1]
        c0, c1, c2, c3 = row.cells[0], row.cells[1], row.cells[2], row.cells[3]
        c0.width, c1.width, c2.width, c3.width = Inches(0.9), Inches(3.2), Inches(1.2), Inches(1.1)
        set_cell_background(c0, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c1, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c2, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c3, HEX_LIGHT_GRAY if r_idx % 2 == 0 else "FFFFFF")
        
        c0.paragraphs[0].add_run(m_code).font.bold = True
        c1.paragraphs[0].add_run(m_name)
        r_pts = c2.paragraphs[0].add_run(m_pts)
        r_pts.font.bold = True
        r_pts.font.color.rgb = COLOR_RED
        c3.paragraphs[0].add_run(m_cat)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    add_heading_3(doc, "Quy trình Lập biên bản & Phê duyệt vi phạm:")
    add_bullet(doc, "Bấm nút 'Lập biên bản vi phạm' -> Tìm kiếm học sinh -> Chọn mã lỗi (L01-L10) -> Nhập địa điểm, mô tả chi tiết -> Bấm 'Lập biên bản'.", "1. Lập biên bản đơn lẻ: ")
    add_bullet(doc, "Đoàn trường hoặc đội cờ đỏ có thể bấm nút 'Nhập Excel vi phạm' ở đầu trang, tải file mẫu Mau_Nhap_Vi_Pham_KPI_Hung_Vuong.xlsx và tải lên hàng loạt biên bản vi phạm trong tuần.", "2. Nhập Excel hàng loạt: ")
    add_bullet(doc, "Ban Giám Hiệu và Quản sinh có thẩm quyền bấm 'Phê duyệt' hoặc 'Từ chối' biên bản. Khi phê duyệt, điểm KPI của học sinh và lớp sẽ tự động được trừ tức thì.", "3. Phê duyệt biên bản: ")

    add_image_safe(doc, r"C:\Users\Admin\.gemini\antigravity-ide\brain\2fab47c2-c667-4efc-8476-e541d6a491a7\kpi_import_modal_1792250539415.png", 
                   "Cửa sổ Nhập Excel Biên Bản Vi Phạm Hàng Loạt của Đội cờ đỏ / Ban nề nếp", width_inch=4.8)

    # --- CHƯƠNG 8 ---
    add_heading_2(doc, "Chương 8: Quản lý Đơn Xin Phép KTX Trực Tuyến")
    add_paragraph(doc, 
        "Học sinh hoặc phụ huynh có nhu cầu về quê cuối tuần, đi học thêm hoặc đi khám bệnh có thể nộp đơn xin phép trực tuyến. "
        "Ban quản lý KTX duyệt đơn trên hệ thống, giúp kiểm soát chính xác sĩ số thực tế có mặt mỗi đêm."
    )
    add_bullet(doc, "Bấm 'Tạo đơn xin phép' -> Chọn học sinh -> Loại lý do (Về quê / Học thêm / Khám bệnh / Lý do khác) -> Nhập ngày giờ đi và về dự kiến.", "• Tạo đơn xin phép: ")
    add_bullet(doc, "Quản sinh bấm 'Duyệt đơn' hoặc 'Từ chối'. Khi đơn được duyệt, học sinh sẽ tự động được đánh dấu 'Vắng có phép' trong ca điểm danh tương ứng.", "• Phê duyệt đơn: ")
    add_bullet(doc, "Khi học sinh trở lại ký túc xá, quản sinh bấm nút 'Xác nhận trở lại (Check-in)' để hoàn tất quy trình an toàn.", "• Điểm danh trở lại (Check-in): ")

    # --- CHƯƠNG 9 ---
    add_heading_2(doc, "Chương 9: Báo Cáo Ma Trận Lỗi & Mẫu In A4 Chuẩn Nghị Định 30/2020")
    add_paragraph(doc, 
        "Hệ thống cung cấp công cụ thống kê chuyên sâu phục vụ công tác sơ kết, tổng kết thi đua của nhà trường:"
    )
    add_bullet(doc, "Thống kê trực quan số vụ vi phạm của từng lớp đối với 10 mã lỗi L01-L10 trong toàn học kỳ.", "• Ma trận 54 Lớp x 10 Mã Lỗi: ")
    add_bullet(doc, "Bảng điểm chi tiết 1.880 học sinh với số điểm trừ và xếp loại thi đua (Xuất sắc, Tốt, Đạt, Chưa đạt). Hỗ trợ nút Xuất file CSV.", "• Bảng điểm KPI toàn trường: ")
    add_bullet(doc, "Hệ thống tự động sinh văn bản báo cáo thi đua và quyết định khen thưởng/kỷ luật theo đúng thể thức Quốc hiệu, Tiêu ngữ, số hiệu văn bản theo Nghị định 30/2020/NĐ-CP của Chính phủ. Giáo viên chỉ cần bấm nút 'In văn bản ngay' để in trực tiếp ra máy in hoặc lưu file PDF.", "• Mẫu in văn bản A4 chuẩn nhà nước: ")

    # --- CHƯƠNG 10 ---
    add_heading_2(doc, "Chương 10: Chuyển Niên Khóa & Quản Trị Hệ Thống")
    add_bullet(doc, "Vào cuối năm học, BGH bấm nút 'Thực hiện chuyển niên khóa' để tự động đôn học sinh Khối 10 lên Khối 11, Khối 11 lên Khối 12 và chuyển Khối 12 sang trạng thái 'Đã tốt nghiệp'. Toàn bộ điểm KPI được tự động thiết lập lại 100 điểm cho năm học mới.", "• Chuyển niên khóa tự động: ")
    add_bullet(doc, "Quản lý danh sách tài khoản, tạo mới giáo viên chủ nhiệm, cấp quyền quản sinh KTX, đổi mật khẩu bảo vệ tài khoản.", "• Quản trị tài khoản & Phân quyền: ")
    add_bullet(doc, "Hệ thống tự động ghi nhật ký mọi thao tác (Lập biên bản, Phê duyệt, Xóa học sinh, Đổi phòng) kèm mốc thời gian và người thực hiện để đảm bảo tính minh bạch, khách quan.", "• Nhật ký hệ thống (Audit Logs): ")

    # ==========================================
    # PHẦN 3: CÂU HỎI THƯỜNG GẶP & HỖ TRỢ KỸ THUẬT
    # ==========================================
    add_heading_1(doc, "PHẦN III: CÂU HỎI THƯỜNG GẶP (FAQ) & HỖ TRỢ KỸ THUẬT")

    add_heading_3(doc, "1. Tôi quên mật khẩu đăng nhập thì phải làm thế nào?")
    add_paragraph(doc, "Trả lời: Quý thầy cô vui lòng liên hệ quản trị viên (tài khoản admin) hoặc cán bộ công nghệ thông tin nhà trường để được cấp lại mật khẩu mặc định (password123).")

    add_heading_3(doc, "2. Khi nhập file Excel học sinh báo lỗi dòng màu đỏ thì xử lý ra sao?")
    add_paragraph(doc, "Trả lời: Hệ thống có cơ chế kiểm tra lỗi tự động. Lỗi thường do trùng Mã học sinh đã có sẵn trong hệ thống, hoặc tên Lớp chuyên không khớp với danh mục 54 lớp chuẩn. Thầy cô chỉ cần sửa lại đúng tên lớp (VD: '10 Chuyên Toán 1') rồi tải lại file.")

    add_heading_3(doc, "3. Hệ thống có dùng được trên điện thoại không?")
    add_paragraph(doc, "Trả lời: Hoàn toàn được! Giao diện hệ thống được thiết kế chuẩn Responsive, tự động tối ưu hóa đẹp mắt trên màn hình điện thoại iPhone, Android, máy tính bảng iPad. Quản sinh có thể cầm điện thoại đi từng phòng để điểm danh rất tiện lợi.")

    add_heading_3(doc, "4. Thông tin liên hệ hỗ trợ kỹ thuật:")
    add_bullet(doc, "Trường THPT Chuyên Hùng Vương — Tỉnh Phú Thọ", "• Đơn vị phát triển: ")
    add_bullet(doc, "Thầy Nguyễn Văn Kính — Quản trị hệ thống", "• Cán bộ phụ trách: ")
    add_bullet(doc, "http://webkpi.ttytphuninh.vn", "• Website chính thức: ")

    # Save document
    doc.save(DOC_PATH)
    print(f"Document successfully created at: {DOC_PATH}")

if __name__ == "__main__":
    main()
