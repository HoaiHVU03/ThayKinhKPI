# -*- coding: utf-8 -*-
"""
Full Document Builder for Project Proposal & Commercialization Dossier
Output: THUYET_MINH_DU_AN_VA_DE_AN_THUONG_MAI_HOA_EDUKPI.docx
"""

import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def build_document():
    doc = docx.Document()
    
    # Page Setup: A4, 20mm Top/Bottom/Right, 25mm Left (standard for binding)
    sections = doc.sections
    for section in sections:
        section.page_width = Inches(8.27)  # A4 width
        section.page_height = Inches(11.69) # A4 height
        section.top_margin = Inches(0.79)   # ~20mm
        section.bottom_margin = Inches(0.79)# ~20mm
        section.left_margin = Inches(0.98)  # ~25mm
        section.right_margin = Inches(0.79) # ~20mm
        
        # Header / Footer setup
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("THUYẾT MINH DỰ ÁN HỆ THỐNG QUẢN LÝ KTX, ĐIỂM DANH & KPI NỀN NẾP (EDUKPI)")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.italic = True
        hrun.font.color.rgb = RGBColor(0x94, 0xa3, 0xb8)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        frun1 = fp.add_run("Tài liệu Thuyết minh Kỹ thuật & Hồ sơ Đề án Thương mại hóa")
        frun1.font.name = "Times New Roman"
        frun1.font.size = Pt(8.5)
        frun1.font.italic = True
        frun1.font.color.rgb = RGBColor(0x94, 0xa3, 0xb8)
        
    # Styles Setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(13)
    normal_style.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
    normal_style.paragraph_format.line_spacing = 1.25
    normal_style.paragraph_format.space_after = Pt(5)

    # Helpers
    from generate_project_dossier import (
        add_p, add_bullet, add_custom_heading, add_callout, add_styled_table,
        set_cell_background, set_cell_margins, set_table_borders, format_paragraph
    )

    # =========================================================================
    # TRANG BÌA (COVER PAGE)
    # =========================================================================
    p_org = doc.add_paragraph()
    format_paragraph(p_org, space_before=10, space_after=2, line_spacing=1.1, align=WD_ALIGN_PARAGRAPH.CENTER)
    r_org1 = p_org.add_run("SỞ GIÁO DỤC VÀ ĐÀO TẠO PHÚ THỌ\n")
    r_org1.font.name = "Times New Roman"
    r_org1.font.size = Pt(12.5)
    r_org1.bold = True
    r_org1.font.color.rgb = RGBColor(0x0e, 0x3a, 0x7c)
    
    r_org2 = p_org.add_run("TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG\n")
    r_org2.font.name = "Times New Roman"
    r_org2.font.size = Pt(13)
    r_org2.bold = True
    r_org2.font.color.rgb = RGBColor(0x0e, 0x3a, 0x7c)
    
    r_div = p_org.add_run("━━━━━━━━━━━━━━━━━━━")
    r_div.font.name = "Times New Roman"
    r_div.font.size = Pt(9)
    r_div.font.color.rgb = RGBColor(0x94, 0xa3, 0xb8)

    # Empty spacing
    for _ in range(2):
        p_space = doc.add_paragraph()
        format_paragraph(p_space, space_before=0, space_after=0, line_spacing=1.0)

    # Project Title Box
    p_title_pre = doc.add_paragraph()
    format_paragraph(p_title_pre, space_before=10, space_after=4, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.CENTER)
    r_tpre = p_title_pre.add_run("BÁO CÁO THUYẾT MINH DỰ ÁN CÔNG NGHỆ\n& HỒ SƠ ĐỀ ÁN THƯƠNG MẠI HÓA")
    r_tpre.bold = True
    r_tpre.font.name = "Times New Roman"
    r_tpre.font.size = Pt(15)
    r_tpre.font.color.rgb = RGBColor(0xd9, 0x77, 0x06) # Deep Amber Gold

    p_title = doc.add_paragraph()
    format_paragraph(p_title, space_before=6, space_after=10, line_spacing=1.2, align=WD_ALIGN_PARAGRAPH.CENTER)
    r_title = p_title.add_run("HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ, ĐIỂM DANH TẬP TRUNG\n& ĐÁNH GIÁ KPI NỀN NẾP HỌC SINH TOÀN DIỆN")
    r_title.bold = True
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(19)
    r_title.font.color.rgb = RGBColor(0x0e, 0x3a, 0x7c)

    p_subtitle = doc.add_paragraph()
    format_paragraph(p_subtitle, space_before=2, space_after=14, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.CENTER)
    r_sub = p_subtitle.add_run("Nền tảng Quản trị Trường học Thông minh (EdTech Smart Campus)\nTên thương mại đề xuất: EduKPI / SmartDormitory Pro\nPhiên bản hệ thống: Release v3.8 AI Integrated")
    r_sub.font.name = "Times New Roman"
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    for _ in range(4):
        p_space = doc.add_paragraph()
        format_paragraph(p_space, space_before=0, space_after=0, line_spacing=1.0)

    # Info metadata table
    info_tbl = doc.add_table(rows=6, cols=2)
    info_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(info_tbl, border_color="E2E8F0", sz="4")
    
    metadata_rows = [
        ("Cơ quan chủ quản & Ứng dụng:", "Trường THPT Chuyên Hùng Vương - Phú Thọ"),
        ("Chủ nhiệm dự án / Tác giả:", "Ban Phát triển Giải pháp Công nghệ EduKPI"),
        ("Quy mô triển khai thử nghiệm:", "54 Lớp chuyên, 1.881 Học sinh, 120 Phòng KTX (6 Tầng)"),
        ("Lĩnh vực chuyên môn:", "Chuyển đổi số Giáo dục & Đào tạo (EdTech & Smart Campus)"),
        ("Căn cứ pháp lý hành chính:", "Nghị định 30/2020/NĐ-CP (Thể thức VB) & NĐ 52/2013/NĐ-CP (TMĐT)"),
        ("Địa điểm & Thời gian thực hiện:", "TP. Việt Trì, Tỉnh Phú Thọ — Năm 2026")
    ]
    for idx, (label, val) in enumerate(metadata_rows):
        row = info_tbl.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.6)
        c1.width = Inches(3.9)
        set_cell_margins(c0, top=70, bottom=70, left=100, right=100)
        set_cell_margins(c1, top=70, bottom=70, left=100, right=100)
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "FFFFFF")
        
        p0 = c0.paragraphs[0]
        format_paragraph(p0, space_before=1, space_after=1, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.LEFT)
        r0 = p0.add_run(label)
        r0.bold = True
        r0.font.name = "Times New Roman"
        r0.font.size = Pt(11)
        r0.font.color.rgb = RGBColor(0x0e, 0x3a, 0x7c)
        
        p1 = c1.paragraphs[0]
        format_paragraph(p1, space_before=1, space_after=1, line_spacing=1.15, align=WD_ALIGN_PARAGRAPH.LEFT)
        r1 = p1.add_run(val)
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(11)
        r1.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)

    doc.add_page_break()

    # =========================================================================
    # MỤC LỤC TỔNG QUAN
    # =========================================================================
    add_custom_heading(doc, "MỤC LỤC TỔNG QUAN TÀI LIỆU", level=1)
    
    toc_data = [
        ("PHẦN I", "THÔNG TIN TỔNG QUAN DỰ ÁN & SỰ CẤP THIẾT CỦA ĐỀ TÀI", "Trang 3"),
        ("1.1", "Thông tin chung về hệ thống và sáng kiến", "Trang 3"),
        ("1.2", "Thực trạng quản lý truyền thống và 5 điểm nghẽn nghiêm trọng", "Trang 3"),
        ("1.3", "Mục tiêu chiến lược và các chỉ tiêu định lượng", "Trang 4"),
        ("PHẦN II", "KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ NỀN TẢNG", "Trang 5"),
        ("2.1", "Mô hình kiến trúc phân tầng hệ thống (Multi-Tier Architecture)", "Trang 5"),
        ("2.2", "Công nghệ Phía máy khách (Modern React & Vite SPA)", "Trang 6"),
        ("2.3", "Công nghệ Phía máy chủ & Chuẩn bảo mật RESTful API", "Trang 6"),
        ("2.4", "Cơ sở dữ liệu tập trung & Thiết kế sẵn sàng SaaS Đa trường học", "Trang 7"),
        ("2.5", "Động cơ Trí tuệ Nhân tạo Dual-Core AI Engine (Gemini Flash & Live RAG)", "Trang 8"),
        ("PHẦN III", "THUYẾT MINH CHI TIẾT 10 PHÂN HỆ CHỨC NĂNG NGHIỆP VỤ", "Trang 9"),
        ("3.1", "Phân hệ 1: Dashboard Trung tâm Giám sát Thời gian thực", "Trang 9"),
        ("3.2", "Phân hệ 2: Quản lý & Điểm danh KTX Thông minh (Zalo 22:15 Automation)", "Trang 10"),
        ("3.3", "Phân hệ 3: Hệ thống Đánh giá Điểm rèn luyện KPI Nền nếp (10 Lỗi L01-L10)", "Trang 11"),
        ("3.4", "Phân hệ 4: Quản lý Đơn vắng mặt & Cảnh báo Đỏ Quá Hạn tự động", "Trang 13"),
        ("3.5", "Phân hệ 5: Điểm danh Lớp học Chính khóa & Giám sát Chuyên cần", "Trang 14"),
        ("3.6", "Phân hệ 6: Quản lý 11 Chế độ Sinh hoạt Nội trú chuẩn Quân ngũ", "Trang 15"),
        ("3.7", "Phân hệ 7: Phân công Lịch trực ban & Trực ca đêm Quản sinh", "Trang 15"),
        ("3.8", "Phân hệ 8: Module In ấn Mẫu văn bản Hành chính Chuẩn Nghị định 30/2020", "Trang 16"),
        ("3.9", "Phân hệ 9: Trợ lý Ảo AI Gemini Flash & Tra cứu CSDL Trực tiếp 24/7", "Trang 17"),
        ("3.10", "Phân hệ 10: Quản trị Người dùng, Phân quyền Ma trận 8 Vai trò & Master Excel", "Trang 18"),
        ("PHẦN IV", "BẢNG SO SÁNH TÍNH NĂNG & 5 TRỤ CỘT ƯU ĐIỂM VƯỢT TRỘI (USP)", "Trang 19"),
        ("4.1", "Bảng so sánh 3 chiều: Thủ công vs Phần mềm thường vs Hệ thống EduKPI", "Trang 19"),
        ("4.2", "Phân tích 5 Trụ cột Giá trị Đột phá khẳng định tính tiên phong", "Trang 20"),
        ("PHẦN V", "HỒ SƠ ĐỀ ÁN THƯƠNG MẠI HÓA & CẨM NANG PHÁP LÝ TOÀN DIỆN", "Trang 21"),
        ("5.1", "Thủ tục Đăng ký / Thông báo Website TMĐT với Bộ Công Thương (online.gov.vn)", "Trang 21"),
        ("5.2", "Thủ tục Đăng ký Bản quyền Tác giả Phần mềm tại Cục Bản quyền Tác giả", "Trang 23"),
        ("5.3", "Thủ tục Đăng ký Bảo hộ Nhãn hiệu & Logo tại Cục Sở hữu Trí tuệ", "Trang 24"),
        ("5.4", "Phương án Bảo đảm An toàn Thông tin theo Cấp độ (Nghị định 85/2016/NĐ-CP)", "Trang 25"),
        ("5.5", "Mô hình Kinh doanh Thương mại & Cơ cấu Gói Dịch vụ Đề xuất (Pricing Model)", "Trang 26"),
        ("PHẦN VI", "LỘ TRÌNH TRIỂN KHAI & HIỆU QUẢ KINH TẾ - XÃ HỘI", "Trang 27"),
        ("6.1", "Lộ trình triển khai 4 giai đoạn chuẩn hóa", "Trang 27"),
        ("6.2", "Đánh giá Hiệu quả Quản lý, Giáo dục và Tiết kiệm Ngân sách", "Trang 28"),
        ("6.3", "Kết luận & Cam kết Chất lượng Dịch vụ", "Trang 28")
    ]
    add_styled_table(doc, ["Mục", "Nội dung thuyết minh chi tiết", "Tham chiếu"], toc_data, col_widths=[0.9, 4.6, 1.0])
    doc.add_page_break()

    # =========================================================================
    # PHẦN I: THÔNG TIN TỔNG QUAN DỰ ÁN & BỐI CẢNH THỰC TIỄN
    # =========================================================================
    add_custom_heading(doc, "PHẦN I: THÔNG TIN TỔNG QUAN DỰ ÁN & SỰ CẤP THIẾT CỦA ĐỀ TÀI", level=1)
    
    add_custom_heading(doc, "1.1 Thông tin chung về dự án", level=2)
    add_p(doc, "Hệ thống Quản lý Ký túc xá, Điểm danh Tập trung & Đánh giá KPI Nền nếp Học sinh Toàn diện (EduKPI / SmartDormitory Pro) là một giải pháp công nghệ số hóa chuyên sâu dành riêng cho các cơ sở giáo dục phổ thông, trường THPT Chuyên, trường Phổ thông Dân tộc Nội trú và các trường liên cấp có quy mô học sinh nội trú lớn. Dự án được nghiên cứu, phát triển và thử nghiệm thực tế tại Trường THPT Chuyên Hùng Vương (tỉnh Phú Thọ) — một trong những đơn vị giáo dục mũi nhọn trọng điểm toàn quốc với quy mô 54 lớp chuyên, 1.881 học sinh và khu Ký túc xá 6 tầng gồm 120 phòng ở hiện đại.", bold_prefix="Tên dự án và quy mô áp dụng: ")
    
    add_p(doc, "Hệ thống ra đời nhằm giải quyết triệt để bài toán kép: Vừa đảm bảo an ninh, trật tự, kỷ cương sinh hoạt nội trú theo chuẩn quân ngũ, vừa thiết lập một công cụ đánh giá rèn luyện học sinh khoa học, minh bạch, công bằng dựa trên chỉ số hiệu suất nề nếp (Discipline KPI) thay thế hoàn toàn cách tính điểm thi đua cảm tính, thủ công trước đây.", bold_prefix="Sứ mệnh cốt lõi: ")

    add_custom_heading(doc, "1.2 Bối cảnh thực tiễn và 5 điểm nghẽn nghiêm trọng trong quản lý truyền thống", level=2)
    add_p(doc, "Trong các trường THPT có ký túc xá, đặc biệt là trường chuyên và nội trú, việc quản lý học sinh ngoài giờ lên lớp luôn là thách thức lớn nhất đối với Ban Giám hiệu, Ban Quản sinh và Giáo viên chủ nhiệm. Khảo sát thực tế tại các trường học trên toàn quốc cho thấy phương thức quản lý thủ công truyền thống đang bộc lộ 5 điểm nghẽn nghiêm trọng sau:")
    
    add_bullet(doc, "Mỗi buổi sáng và tối (22:00), Quản sinh và Trưởng tầng phải cầm sổ giấy đi từng phòng kiểm tra quân số, sau đó ghi chép thủ công. Quá trình này mất từ 45 đến 60 phút, tiềm ẩn sai sót khi học sinh chuyển phòng, tráo phòng hoặc khai báo sai sự thật.", bold_prefix="1. Điểm danh thủ công chậm chạp, dễ thất thoát và gian lận:")
    add_bullet(doc, "Sau khi kết thúc điểm danh 22:00, phải mất thêm 30-45 phút để Ban Quản sinh cộng sổ và tổng hợp gửi Ban Giám hiệu qua tin nhắn điện thoại hoặc trao đổi miệng. Sự chậm trễ này khiến nhà trường hoàn toàn bị động nếu học sinh tự ý trốn KTX sau giờ giới nghiêm, phát sinh nguy cơ tai nạn, vi phạm pháp luật ngoài khuôn viên trường.", bold_prefix="2. Thông tin đứt gãy, chậm trễ báo cáo Ban Giám hiệu:")
    add_bullet(doc, "Việc xếp loại hạnh kiểm học sinh hàng tháng và học kỳ hiện nay phụ thuộc chủ yếu vào sự ghi nhớ của cờ đỏ, cán bộ lớp hoặc nhận xét cảm tính của GVCN. Thiếu hệ thống bằng chứng (hình ảnh, mốc thời gian, địa điểm vi phạm) dẫn đến khiếu nại, bức xúc từ phía học sinh và phụ huynh khi bị trừ điểm.", bold_prefix="3. Thiếu công cụ định lượng minh bạch về rèn luyện nề nếp:")
    add_bullet(doc, "Học sinh muốn xin về quê hoặc vắng mặt phải viết giấy xin phép tay, xin chữ ký GVCN rồi nộp cho Quản sinh. Nếu học sinh không trở lại trường đúng giờ hẹn, nhà trường không có cơ chế cảnh báo tự động, dẫn đến tình trạng học sinh vắng mặt nhiều ngày mà phụ huynh và nhà trường đều tưởng em đang ở phía bên kia.", bold_prefix="4. Lỗ hổng nguy hiểm trong kiểm soát đơn xin phép và quá hạn:")
    add_bullet(doc, "Các báo cáo gửi Sở GD&ĐT, học bạ học sinh, biên bản kỷ luật phải soạn thảo thủ công trên máy tính, tốn kém hàng nghìn trang in giấy mỗi năm và thường xuyên sai lệch thể thức theo quy định của Nhà nước.", bold_prefix="5. Lãng phí tài nguyên in ấn và vi phạm quy chuẩn văn thư hành chính:")

    add_callout(doc, [
        "\"Sự chậm trễ dù chỉ 15 phút trong việc phát hiện học sinh vắng mặt tại Ký túc xá lúc nửa đêm có thể dẫn đến những rủi ro an ninh khôn lường. Một hệ thống số hóa cảnh báo thời gian thực (Real-time Alerting) và tự động hóa toàn bộ luồng báo cáo gửi Ban Giám hiệu lúc 22:15 là yêu cầu sống còn đối với công tác bảo vệ an toàn học sinh tại mọi trường nội trú hiện nay.\"",
        "— Trích Báo cáo Đánh giá Tác động Quản trị KTX của Ban Giám hiệu Trường THPT Chuyên Hùng Vương."
    ], title="CẢNH BÁO TỪ THỰC TIỄN QUẢN TRỊ TRƯỜNG HỌC", box_type="warning")

    add_custom_heading(doc, "1.3 Mục tiêu chiến lược của dự án", level=2)
    add_p(doc, "Dự án EduKPI đặt ra các mục tiêu giải pháp cụ thể mang tính cách mạng cho ngành giáo dục:")
    add_bullet(doc, "Số hóa 100% dữ liệu nhân khẩu học, hồ sơ lớp học, phòng KTX, dữ liệu chuyên cần và lịch sử rèn luyện của học sinh trên một nền tảng cơ sở dữ liệu tập trung duy nhất.", bold_prefix="Mục tiêu 1 (Số hóa toàn diện):");
    add_bullet(doc, "Rút ngắn thời gian điểm danh tối 120 phòng KTX từ 60 phút xuống dưới 10 phút. Đúng 22:15 hàng đêm, hệ thống tự động sinh và gửi bản tin Zalo chuẩn thể thức đến Ban Giám hiệu.", bold_prefix="Mục tiêu 2 (Tự động hóa báo cáo):");
    add_bullet(doc, "Thiết lập Thang điểm 100 KPI chuẩn hóa đầu mỗi kỳ, quản lý minh bạch 10 nhóm lỗi vi phạm (L01 -> L10) kèm bằng chứng ảnh chụp, video và quy trình duyệt biên bản 2 cấp độ.", bold_prefix="Mục tiêu 3 (Minh bạch hóa kỷ luật):");
    add_bullet(doc, "Triển khai cơ chế Cảnh báo Đỏ Quá Hạn (Red Overdue Flag): Tự động phát tín hiệu báo động khi học sinh quá giờ hẹn trở lại KTX, kích hoạt quy trình liên lạc khẩn cấp phụ huynh.", bold_prefix="Mục tiêu 4 (Bảo đảm an toàn tuyệt đối):");
    add_bullet(doc, "Tích hợp Trợ lý Trí tuệ Nhân tạo Google Gemini Flash 24/7 giúp phụ huynh, học sinh và giáo viên tra cứu tức thời thông tin nề nếp, lịch trình, phòng ở và nội quy.", bold_prefix="Mục tiêu 5 (Ứng dụng AI thông minh):");
    add_bullet(doc, "Chuẩn hóa 100% văn bản kết xuất (phiếu rèn luyện, báo cáo KTX, sổ theo dõi) theo đúng thể thức Nghị định 30/2020/NĐ-CP của Chính phủ, sẵn sàng in kẹp vào học bạ học sinh.", bold_prefix="Mục tiêu 6 (Chuẩn hóa thể thức hành chính):");

    doc.add_page_break()

    # =========================================================================
    # PHẦN II: KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ NỀN TẢNG
    # =========================================================================
    add_custom_heading(doc, "PHẦN II: KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ NỀN TẢNG", level=1)
    
    add_custom_heading(doc, "2.1 Mô hình kiến trúc phân tầng (Multi-Tier Architecture)", level=2)
    add_p(doc, "Hệ thống EduKPI được thiết kế theo mô hình kiến trúc phân tầng hiện đại (Multi-Tier Architecture), tuân thủ các chuẩn mực phát triển phần mềm doanh nghiệp, bảo đảm tính ổn định, độ trễ cực thấp và khả năng mở rộng quy mô phục vụ đồng thời hàng chục nghìn người dùng.")
    
    arch_table_data = [
        ("Tầng Giao diện\n(Client Presentation)", "React 18 + TypeScript + Tailwind CSS", "SPA siêu mượt, Reactive State Management, tối ưu hóa giao diện di động (Mobile First) cho Quản sinh & Trưởng phòng."),
        ("Tầng Cổng giao tiếp\n(API Gateway / Routing)", "RESTful API Engine + JSON Payloads", "Xử lý định tuyến thông minh, xác thực Token JWT/Session, kiểm soát CORS, kiểm soát rate-limit và bảo vệ chống tấn công DDoS."),
        ("Tầng Nghiệp vụ\n(Application Services)", "PHP 8.x Clean Architecture + OOP", "Chứa toàn bộ logic lõi: Tính điểm KPI, luân chuyển 10 API Key Gemini, thuật toán cảnh báo quá hạn, sinh báo cáo Zalo, kiểm tra quyền RBAC."),
        ("Tầng Dữ liệu\n(Data Persistence)", "MySQL 8.x Enterprise + InnoDb Engine", "Chuẩn hóa cơ sở dữ liệu 3NF, ràng buộc toàn vẹn khóa ngoại (Foreign Keys), cơ chế tự động backup, sẵn sàng kiến trúc Đa trường học (Multi-tenant)."),
        ("Tầng Trí tuệ Nhân tạo\n(AI Intelligence Layer)", "Dual-Core AI (Gemini Flash + Live RAG + Local Engine)", "Hệ sinh thái AI 3 cấp độ: Gọi API Google Gemini với cơ chế xoay vòng 10 Key; Live RAG tiêm dữ liệu CSDL thời gian thực; và Động cơ nội bộ dự phòng khi offline.")
    ]
    add_styled_table(doc, ["Tầng kiến trúc", "Công nghệ ứng dụng", "Chức năng & Nhiệm vụ chính"], arch_table_data, col_widths=[1.5, 2.0, 3.0])

    add_custom_heading(doc, "2.2 Công nghệ Phía máy khách (Frontend Stack)", level=2)
    add_bullet(doc, "Cung cấp kiến trúc module hóa với các component tái sử dụng, hiệu năng rendering tối đa nhờ cơ chế Virtual DOM, loại bỏ hoàn toàn độ trễ khi chuyển đổi giữa 16 trang nghiệp vụ.", bold_prefix="React 18 & Single Page Application (SPA):")
    add_bullet(doc, "Toàn bộ mã nguồn phía Client được định kiểu tĩnh nghiêm ngặt (Strict Type Safety), ngăn ngừa 99% lỗi crash giao diện runtime, đảm bảo tính chuẩn xác cho các luồng dữ liệu tính điểm KPI phức tạp.", bold_prefix="TypeScript Engine:")
    add_bullet(doc, "Hệ thống thiết kế giao diện theo phong cách tối giản sang trọng (Executive Minimalist), sử dụng bảng màu HSL cao cấp với sắc xanh chủ đạo Education Navy (#0E3A7C), biểu tượng chuẩn Lucide Icons, tương thích hoàn hảo trên điện thoại, máy tính bảng và màn hình lớn.", bold_prefix="Tailwind CSS & Mobile-First UX:")
    add_bullet(doc, "Thời gian đóng gói mã nguồn dưới 1 giây, dung lượng bundle siêu nhẹ (Gzip ~460KB), tốc độ tải trang lần đầu dưới 0.8 giây ngay cả trên mạng 3G/4G chập chờn.", bold_prefix="Vite Build System:")

    add_custom_heading(doc, "2.3 Công nghệ Phía máy chủ & Chuẩn bảo mật API (Backend Stack)", level=2)
    add_bullet(doc, "Ứng dụng các tính năng mới nhất của PHP 8.x (JIT compiler, typed properties, match expressions, attributes) cho tốc độ thực thi API trung bình dưới 45ms mỗi request.", bold_prefix="PHP 8.x Clean Architecture:")
    add_bullet(doc, "100% các câu lệnh truy vấn dữ liệu đều sử dụng cơ chế liên kết tham số (Parameterized Queries) qua PDO, loại bỏ hoàn toàn nguy cơ tấn công chiếm quyền điều khiển cơ sở dữ liệu qua SQL Injection.", bold_prefix="PDO Prepared Statements:")
    add_bullet(doc, "Hệ thống áp dụng ma trận phân quyền 8 vai trò (Admin, Quản sinh, GVCN, Cán sự lớp, Trưởng tầng, Trưởng phòng, Đoàn trường, Học sinh). Mọi truy vấn đều được lọc tự động theo phạm vi (Scope Filtering): GVCN chỉ xem được lớp mình, Trưởng phòng chỉ điểm danh được phòng mình, ngăn ngừa rò rỉ dữ liệu cá nhân.", bold_prefix="Ma trận phân quyền RBAC phân cấp sâu:")

    add_custom_heading(doc, "2.4 Cơ sở dữ liệu tập trung & Thiết kế Đa trường học (Multi-tenant SaaS)", level=2)
    add_p(doc, "Hệ thống cơ sở dữ liệu MySQL gồm hơn 20 bảng chuẩn hóa cao độ, lưu trữ toàn diện hồ sơ học sinh, phân công phòng ở, lịch sử điểm danh từng ca, biên bản vi phạm, đơn nghỉ phép và cấu hình hệ thống. Đặc biệt, hệ thống đã được tích hợp sẵn kiến trúc School Workspaces cho phép:")
    add_bullet(doc, "Mỗi trường học khi tham gia hệ thống được cấp một không gian dữ liệu riêng biệt, bảo đảm bí mật tuyệt đối giữa các đơn vị giáo dục.", bold_prefix="Phân tách dữ liệu đa trường (Tenant Isolation):")
    add_bullet(doc, "Hỗ trợ Sở GD&ĐT hoặc Phòng GD&ĐT quản lý tập trung hàng chục trường THPT trên một máy chủ duy nhất, dễ dàng kết xuất báo cáo so sánh nề nếp toàn tỉnh.", bold_prefix="Quản trị tập trung phân cấp (Centralized Administration):")

    add_custom_heading(doc, "2.5 Động cơ Trí tuệ Nhân tạo Dual-Core AI Engine (Gemini Flash & Live RAG)", level=2)
    add_p(doc, "Điểm sáng công nghệ đột phá của hệ thống EduKPI là Động cơ AI thế hệ mới được thiết kế theo cấu trúc 3 tầng bảo vệ độc quyền:")
    
    add_bullet(doc, "Hệ thống hỗ trợ cấu hình bể 10 Google Gemini API Key trong trang Quản trị. Thuật toán xoay vòng vòng tròn (Round-Robin with Automatic Fallback) sẽ tự động kích hoạt key dự phòng ngay khi một key chạm hạn ngạch 429 hoặc gặp sự cố mạng, bảo đảm dịch vụ AI hoạt động 24/7 không gián đoạn.", bold_prefix="Tầng 1 - Bể 10 API Key Gemini Luân chuyển Tự động:")
    add_bullet(doc, "Trước khi gửi câu hỏi người dùng lên Gemini, hệ thống tự động bóc tách từ khóa để truy vấn trực tiếp CSDL MySQL (danh sách 54 lớp, sĩ số, GVCN, 120 phòng KTX, học sinh đang lưu trú, đơn vắng mặt gần nhất) rồi tiêm ngữ cảnh thời gian thực vào System Prompt. Nhờ đó, AI trả lời chính xác từng con số thực tế mà không bao giờ bị 'ảo giác' (hallucination).", bold_prefix="Tầng 2 - RAG Thời gian thực (Live Retrieval Augmented Generation):")
    add_bullet(doc, "Nếu trường học mất kết nối Internet quốc tế hoặc toàn bộ API Key của Gemini bị nghẽn, hệ thống tự động kích hoạt Động cơ Tri thức Nội bộ. Động cơ này tự phân tích câu hỏi và truy vấn trực tiếp CSDL để trả về bảng biểu chi tiết (về lớp học, học sinh, số phòng, nề nếp, 11 chế độ, 10 lỗi vi phạm) mà không cần phụ thuộc vào AI bên ngoài.", bold_prefix="Tầng 3 - Động cơ Dự phòng Cục bộ Thông minh (Smart Local Engine):")
    add_bullet(doc, "Tích hợp bộ lọc ngữ nghĩa nghiêm ngặt. Nếu người dùng hỏi các nội dung ngoài lề trường học (chính trị, giải trí, lập trình bên ngoài...), AI sẽ lịch sự từ chối và hướng dẫn quay lại nghiệp vụ sư phạm.", bold_prefix="Tầng 4 - Bộ lọc an toàn phạm vi (AI Guardrails):")

    doc.add_page_break()

    # =========================================================================
    # PHẦN III: THUYẾT MINH CHI TIẾT 10 PHÂN HỆ CHỨC NĂNG NGHIỆP VỤ
    # =========================================================================
    add_custom_heading(doc, "PHẦN III: THUYẾT MINH CHI TIẾT 10 PHÂN HỆ CHỨC NĂNG NGHIỆP VỤ", level=1)
    
    add_custom_heading(doc, "3.1 Phân hệ 1: Dashboard Trung tâm Giám sát Thời gian thực (Executive Real-time Dashboard)", level=2)
    add_p(doc, "Phân hệ Dashboard cung cấp cho Ban Giám hiệu và Ban Quản lý cái nhìn toàn cảnh tức thời về toàn bộ hoạt động của nhà trường và ký túc xá chỉ trong một màn hình điều hành duy nhất:")
    add_bullet(doc, "Hiển thị tổng số 1.881 học sinh, phân loại 700 học sinh nội trú KTX, 1.181 học sinh ngoại trú, cơ cấu 54 lớp chuyên theo 3 khối 10, 11, 12.", bold_prefix="1. Đồng hồ đếm nhân khẩu học trực tiếp:")
    add_bullet(doc, "Thống kê tỷ lệ có mặt tại KTX ca sáng (06:00) và ca tối (22:00), tỷ lệ có mặt trên lớp chính khóa, cảnh báo trực quan các ca điểm danh chưa hoàn tất.", bold_prefix="2. Giám sát chuyên cần thời gian thực:")
    add_bullet(doc, "Biểu đồ phân tích số vụ vi phạm theo khối, theo môn chuyên, danh sách Top 5 lớp có nề nếp xuất sắc nhất và Top học sinh cần lưu ý nhắc nhở rèn luyện (điểm KPI dưới 80đ).", bold_prefix="3. Phân tích xu hướng kỷ luật và cảnh báo nguy cơ:")

    add_custom_heading(doc, "3.2 Phân hệ 2: Quản lý & Điểm danh Ký túc xá Thông minh (Smart Dormitory Management & Zalo Automation)", level=2)
    add_p(doc, "Đây là phân hệ hạt nhân được tối ưu hóa cho quy trình vận hành thực tế tại khu Ký túc xá 6 tầng gồm 120 phòng ở:")
    add_bullet(doc, "Sơ đồ hiển thị trực quan cấu trúc KTX: Tầng 1 (Sảnh, Phòng Quản sinh, Thiết bị PCCC); Tầng 2 & 3 (Khu Nam sinh gồm các phòng P201 - P324); Tầng 4 (Khu liên tầng có vách ngăn cách ly độc lập); Tầng 5 & 6 (Khu Nữ sinh gồm các phòng P501 - P624). Màu sắc phòng thể hiện trạng thái: Đầy phòng (Đỏ), Còn chỗ (Xanh lá), Đang bảo trì (Xám).", bold_prefix="1. Sơ đồ KTX 6 tầng trực quan:")
    add_bullet(doc, "Vào lúc 22:00 hàng đêm, Trưởng phòng mở ứng dụng trên điện thoại, bấm nút 'Có mặt tất cả' chỉ mất 2 giây đối với phòng đủ quân số. Nếu có bạn vắng, Trưởng phòng tích chọn trạng thái cụ thể: 'Nghỉ có phép' (đã có đơn duyệt) hoặc 'Vắng không phép'.", bold_prefix="2. Điểm danh tối 1 chạm siêu tốc (Nút 'Có mặt tất cả'):")
    add_bullet(doc, "Màn hình dành riêng cho Ban Quản sinh tự động cập nhật tiến độ điểm danh theo từng giây. Quản sinh biết ngay phòng nào chưa báo cáo, học sinh nào vắng mặt kèm họ tên phụ huynh và số điện thoại gọi khẩn cấp để xử lý tức thời.", bold_prefix="3. Trung tâm Giám sát Real-time (Real-time Monitoring Center):")
    add_bullet(doc, "Đúng 22:15 hàng đêm, hệ thống tự động tổng hợp toàn bộ dữ liệu 120 phòng, chuẩn bị sẵn bản tin Zalo chuẩn thể thức theo từng tầng hoặc toàn trường để Quản sinh gửi vào nhóm Ban Giám hiệu và Đoàn trường chỉ bằng một nút bấm 'Sao chép báo cáo Zalo'.", bold_prefix="4. Tự động hóa Báo cáo Zalo 22:15 gửi BGH:")

    add_callout(doc, [
        "MẪU BÁO CÁO ZALO ĐIỂM DANH TỐI KTX (TỰ ĐỘNG XUẤT LÚC 22:15):",
        "📋 BÁO CÁO ĐIỂM DANH KTX THPT CHUYÊN HÙNG VƯƠNG - CA 22:00 NGÀY 21/10/2026",
        "• Tổng số phòng KTX: 120/120 phòng đã hoàn thành điểm danh (100%).",
        "• Tổng quân số nội trú: 699 học sinh. Có mặt: 695 em (99.4%).",
        "• Nghỉ có phép: 04 em (Nguyễn Văn A - 10 Toán 1 P203 về quê; Trần Thị B - 11 Anh 2 P504 ốm).",
        "• Vắng không phép: 00 em (Toàn bộ 120 phòng an toàn tuyệt đối).",
        "• Trực ban Quản sinh: Thầy Nguyễn Văn Kính | Giới nghiêm tắt đèn: 22:30."
    ], title="VÍ DỤ BẢN TIN ZALO TỰ ĐỘNG SINH BỞI HỆ THỐNG", box_type="success")

    add_custom_heading(doc, "3.3 Phân hệ 3: Hệ thống Đánh giá Điểm rèn luyện KPI Nền nếp (Discipline & KPI Scoring Engine)", level=2)
    add_p(doc, "Thay vì đánh giá hạnh kiểm một cách định tính, trừu tượng, hệ thống EduKPI chuyển hóa toàn bộ nề nếp học đường thành chỉ số định lượng khoa học (Key Performance Indicators):")
    add_bullet(doc, "Đầu mỗi học kỳ, mỗi học sinh được cấp 100 điểm KPI chuẩn. Điểm số sẽ biến động tương ứng với việc chấp hành kỷ luật và thành tích đóng góp.", bold_prefix="1. Thang điểm chuẩn 100 điểm ban đầu:")
    add_bullet(doc, "Toàn bộ các vi phạm phổ biến được mã hóa thành 10 nhóm chuẩn mực từ L01 đến L10 với mức trừ điểm tương ứng minh bạch.", bold_prefix="2. Danh mục 10 Nhóm Lỗi Vi phạm chuẩn hóa (L01 -> L10):")

    kpi_rules_data = [
        ("L01", "Muộn giờ / Vắng mặt không phép điểm danh KTX", "-10 điểm", "Nghiêm trọng", "Ảnh hưởng an toàn"),
        ("L02", "Phòng ở bừa bộn, không gấp chăn màn nội vụ", "-5 điểm", "Nhẹ", "Nền nếp nội vụ"),
        ("L03", "Gây ồn ào, làm mất trật tự sau 22:30", "-10 điểm", "Trung bình", "Giờ giới nghiêm"),
        ("L04", "Sử dụng thiết bị điện công suất lớn trái phép", "-15 điểm", "Nghiêm trọng", "Nguy cơ cháy nổ"),
        ("L05", "Đưa người ngoài hoặc bạn khác giới vào phòng", "-20 điểm", "Rất nghiêm trọng", "An ninh KTX"),
        ("L06", "Trèo tường, trốn ra ngoài KTX ban đêm sau 22h", "-30 điểm", "Đặc biệt nghiêm trọng", "Rủi ro an toàn"),
        ("L07", "Hút thuốc lá, tàng trữ rượu bia, cờ bạc", "-40 điểm", "Đặc biệt nghiêm trọng", "Kỷ luật học đường"),
        ("L08", "Gây gổ, đánh nhau, xúc phạm danh dự người khác", "-50 điểm", "Đình chỉ / Kỷ luật", "Bạo lực học đường"),
        ("L09", "Làm hư hỏng tài sản công, thiết bị KTX/PCCC", "-20 điểm + Bồi thường", "Nghiêm trọng", "Tài sản công"),
        ("L10", "Gian lận điểm danh, điểm danh hộ, khai báo sai", "-25 điểm", "Rất nghiêm trọng", "Tính trung thực")
    ]
    add_styled_table(doc, ["Mã lỗi", "Tên nhóm hành vi vi phạm", "Mức trừ điểm", "Mức độ", "Nhóm quản lý"], kpi_rules_data, col_widths=[0.8, 2.7, 1.2, 1.3, 1.5])

    add_bullet(doc, "Cán bộ trực ban, Quản sinh hoặc Cờ đỏ lập biên bản ngay trên điện thoại: Tải ảnh chụp/video bằng chứng, định vị thời gian, địa điểm vi phạm. Biên bản phải qua 2 bước kiểm duyệt (Người lập trình -> GVCN hoặc Quản sinh phê duyệt) mới có hiệu lực trừ điểm, ngăn chặn tuyệt đối tình trạng phạt oan.", bold_prefix="3. Quy trình lập Biên bản vi phạm có minh chứng số:")
    add_bullet(doc, "Căn cứ điểm KPI cuối kỳ, hệ thống tự động phân loại: Xuất sắc (≥95đ), Tốt (85-94đ), Khá (70-84đ), Trung bình (50-69đ), Yếu (<50đ), đồng thời tự động cập nhật Bảng xếp hạng nề nếp thi đua 54 lớp chuyên.", bold_prefix="4. Phân loại rèn luyện và bảng xếp hạng thi đua:")

    add_custom_heading(doc, "3.4 Phân hệ 4: Quản lý Đơn vắng mặt & Cơ chế Cảnh báo Đỏ Quá Hạn (Leave Requests & Overdue Alerting)", level=2)
    add_p(doc, "Phân hệ giải quyết bài toán kiểm soát học sinh ra vào KTX và bảo đảm học sinh không bị rơi vào 'khoảng trống giám sát':")
    add_bullet(doc, "Học sinh hoặc phụ huynh điền đơn trên web/app (chọn lý do: về quê, ốm đau, thi đấu HSG; thời gian bắt đầu đi và giờ dự kiến trở lại KTX).", bold_prefix="1. Nộp đơn trực tuyến 24/7:")
    add_bullet(doc, "Giáo viên chủ nhiệm kiểm tra, xác nhận -> Ban Quản sinh bấm phê duyệt. Dữ liệu tự động đồng bộ sang ca điểm danh tối, phòng đó sẽ hiển thị 'Nghỉ có phép' mà Trưởng phòng không cần báo cáo lại.", bold_prefix="2. Luồng phê duyệt 2 cấp đồng bộ:")
    add_bullet(doc, "Khi học sinh trở lại KTX, Trưởng phòng hoặc Quản sinh quét mã hoặc bấm 'Xác nhận Check-in' để hoàn tất đơn.", bold_prefix="3. Thủ tục Check-in trở lại trường:")
    add_bullet(doc, "Nếu đã quá giờ hẹn trở lại (ví dụ hẹn 20:00 Chủ Nhật nhưng 20:30 chưa check-in), hệ thống tự động gắn nhãn đỏ CẢNH BÁO QUÁ HẠN nhấp nháy trên Dashboard Quản sinh, đồng thời hiển thị số điện thoại phụ huynh để nhà trường gọi điện xác minh ngay lập tức.", bold_prefix="4. TÍNH NĂNG ĐỘC QUYỀN: BÁO ĐỘNG ĐỎ QUÁ HẠN (Red Overdue Flag):")

    add_custom_heading(doc, "3.5 Phân hệ 5: Điểm danh Lớp học Chính khóa & Giám sát Chuyên cần (Class Attendance)", level=2)
    add_p(doc, "Không chỉ dừng lại ở KTX, hệ thống mở rộng kiểm soát toàn bộ 54 lớp chuyên trong các giờ học chính khóa ca sáng và ca chiều:")
    add_bullet(doc, "Giáo viên bộ môn hoặc Ban Cán Sự lớp điểm danh nhanh từng tiết, ghi nhận học sinh nghỉ có phép, không phép, muộn học.", bold_prefix="1. Điểm danh theo tiết học:")
    add_bullet(doc, "Hệ thống tự động đối chiếu: Nếu học sinh có mặt ở KTX ban đêm nhưng sáng hôm sau vắng mặt trên lớp mà không có đơn xin phép, hệ thống lập tức phát cảnh báo nguy cơ trốn tiết/bỏ học.", bold_prefix="2. Đối soát chéo KTX - Giảng đường:")

    add_custom_heading(doc, "3.6 Phân hệ 6: Quản lý 11 Chế độ Sinh hoạt Nội trú Chuẩn Quân ngũ (11 Daily Regimes)", level=2)
    add_p(doc, "Chuẩn hóa tác phong sinh hoạt nội trú thông qua thời gian biểu 11 chế độ sinh hoạt cố định trong ngày:")
    add_bullet(doc, "05:15 - 05:30: Báo thức toàn KTX | 05:30 - 06:00: Thể dục sáng sân KTX | 06:00 - 06:30: Gấp chăn màn, chỉnh trang nội vụ phòng ở.", bold_prefix="Ca sáng:");
    add_bullet(doc, "06:30 - 07:15: Ăn sáng nhà ăn | 07:15 - 07:30: Niêm phong KTX, khóa cửa tầng | 07:30 - 11:30: Học chính khóa Tòa A | 11:45 - 13:30: Ăn trưa và nghỉ trưa tại KTX.", bold_prefix="Ca trưa:");
    add_bullet(doc, "16:30 - 17:45: Thể thao chiều | 18:00 - 18:15: Chốt cổng KTX | 19:30 - 21:45: Tự học tối nghiêm túc | 22:00 - 22:30: Điểm danh tối 120 phòng & Tắt đèn đi ngủ lúc 22:30.", bold_prefix="Ca tối:");

    add_custom_heading(doc, "3.7 Phân hệ 7: Phân công Lịch trực ban & Trực ca đêm Quản sinh (Duty Management)", level=2)
    add_bullet(doc, "Tự động phân công lịch trực cho Ban Quản sinh, Giáo viên trực đêm và Ban Tự quản học sinh theo ngày, tuần, tháng.", bold_prefix="1. Lịch trực luân phiên:");
    add_bullet(doc, "Ghi nhận nhật ký trực ca, các sự cố phát sinh (y tế, sửa chữa điện nước, vi phạm trật tự) và bàn giao ca trực trực tuyến.", bold_prefix="2. Sổ nhật ký trực điện tử:");

    add_custom_heading(doc, "3.8 Phân hệ 8: Module In ấn Mẫu văn bản Hành chính Chuẩn Nghị định 30/2020/NĐ-CP (A4 Ready)", level=2)
    add_p(doc, "Một ưu thế vượt trội của hệ thống là tuân thủ nghiêm ngặt thể thức văn bản hành chính Việt Nam theo Nghị định 30/2020/NĐ-CP của Chính phủ:")
    add_bullet(doc, "Tự động sinh mẫu in A4 chuẩn xác với Quốc hiệu, Tiêu ngữ, Tên cơ quan chủ quản (Sở GD&ĐT Phú Thọ), Tên đơn vị ban hành (Trường THPT Chuyên Hùng Vương), Số ký hiệu văn bản, địa danh và ngày tháng.", bold_prefix="1. Đúng thể thức Nghị định 30/2020/NĐ-CP:")
    add_bullet(doc, "Bao gồm: Phiếu đánh giá KPI cá nhân học sinh (dùng để kẹp vào học bạ cuối năm); Báo cáo tổng kết công tác KTX hàng tháng/học kỳ gửi Ban Giám hiệu; Sổ theo dõi nề nếp thi đua 54 lớp chuyên gửi Đoàn trường.", bold_prefix="2. Mẫu in đa dạng:")
    add_bullet(doc, "Xem trước trực quan trên trình duyệt và kết xuất file PDF chất lượng cao, căn lề chuẩn 20mm-25mm, hỗ trợ in ấn một chạm trên mọi loại máy in văn phòng.", bold_prefix="3. Xuất file PDF & In trực tiếp:")

    add_custom_heading(doc, "3.9 Phân hệ 9: Trợ lý Ảo AI Gemini Flash & Tra cứu CSDL Trực tiếp 24/7", level=2)
    add_p(doc, "Cửa sổ Chatbot tra cứu thông minh tích hợp Google Gemini Flash cho phép học sinh, phụ huynh và giáo viên đặt câu hỏi bằng ngôn ngữ tự nhiên:")
    add_bullet(doc, "Hỏi về lớp học (ví dụ: 'có những lớp Toán nào?'): AI liệt kê ngay 6 lớp chuyên Toán từ khối 10 đến 12, kèm họ tên GVCN, số điện thoại và phòng học.", bold_prefix="1. Tra cứu lớp học & Giáo viên chủ nhiệm:")
    add_bullet(doc, "Hỏi về số phòng (ví dụ: 'phòng 201 có những ai?'): AI trích xuất ngay tầng, khu nam sinh, sĩ số và danh sách các học sinh đang ở.", bold_prefix="2. Tra cứu phòng KTX & Bạn ở cùng:")
    add_bullet(doc, "Hỏi về nội quy ('L06 bị trừ mấy điểm?'): AI trích dẫn ngay thang điểm vi phạm và quy định kỷ luật.", bold_prefix="3. Giải đáp nội quy, chế độ & Đơn xin nghỉ:")

    add_custom_heading(doc, "3.10 Phân hệ 10: Quản trị Người dùng, Phân quyền Ma trận 8 Vai trò & Master Excel", level=2)
    add_bullet(doc, "Phân quyền chặt chẽ theo 8 vai trò: 1. Admin/BGH (Toàn quyền) | 2. Quản sinh KTX (Toàn bộ 120 phòng) | 3. GVCN (Quản lý 1 lớp) | 4. Cán sự lớp (Lớp trưởng/Bí thư) | 5. Trưởng tầng KTX (Quản lý 1 tầng) | 6. Trưởng phòng KTX (Điểm danh 1 phòng) | 7. Đoàn trường/Cờ đỏ (Lập biên bản vi phạm) | 8. Học sinh/Phụ huynh (Xem hồ sơ cá nhân).", bold_prefix="1. Ma trận phân quyền RBAC 8 cấp độ:")
    add_bullet(doc, "Nhập liệu toàn bộ danh sách 1.881 học sinh, 54 lớp, 120 phòng và tự động cấp tài khoản đăng nhập chỉ với một lần tải lên tệp Excel mẫu chuẩn, tiết kiệm hàng trăm giờ lao động hành chính.", bold_prefix="2. Công cụ Master Excel 1 Chạm:");

    doc.add_page_break()

    # =========================================================================
    # PHẦN IV: BẢNG SO SÁNH TÍNH NĂNG & 5 TRỤ CỘT ƯU ĐIỂM VƯỢT TRỘI (USP)
    # =========================================================================
    add_custom_heading(doc, "PHẦN IV: BẢNG SO SÁNH TÍNH NĂNG & 5 TRỤ CỘT ƯU ĐIỂM VƯỢT TRỘI (USP)", level=1)
    
    add_custom_heading(doc, "4.1 Bảng so sánh 3 chiều", level=2)
    add_p(doc, "Để làm nổi bật tính ưu việt của dự án khi thương mại hóa và thuyết minh trước khách hàng / hội đồng nghiệm thu, bảng dưới đây so sánh chi tiết phương pháp thủ công, các phần mềm quản lý học sinh thông thường và Hệ thống EduKPI:")
    
    comparison_data = [
        ("Điểm danh KTX tối (22:00)", "Sổ giấy, mất 45-60 phút, dễ gian lận", "Tích chọn danh sách dài, mất 20-30 phút", "Nút 'Có mặt tất cả' 1 chạm, chỉ mất 5-10 phút toàn KTX 120 phòng."),
        ("Báo cáo gửi Ban Giám hiệu", "Báo miệng hoặc nhắn tin riêng lẻ sau 23h", "Xuất file Excel tải về máy tính gửi email", "Tự động sinh bản tin Zalo chuẩn thể thức lúc 22:15 chỉ bằng 1 nút bấm."),
        ("Kiểm soát đơn vắng mặt KTX", "Giấy viết tay, dễ thất lạc, không kiểm soát", "Lưu trên hệ thống nhưng không cảnh báo", "Cảnh báo Đỏ Quá Hạn nhấp nháy tức thì khi học sinh về muộn giờ hẹn."),
        ("Đánh giá nề nếp kỷ luật", "Ghi sổ cờ đỏ, đánh giá cảm tính, hay khiếu nại", "Chỉ ghi chép vi phạm, không có thang điểm", "Thang 100 điểm KPI chuẩn hóa, 10 nhóm lỗi L01-L10, minh chứng ảnh/video."),
        ("Hỗ trợ in ấn hành chính", "Gõ Word thủ công, sai lệch thể thức NĐ 30", "In lưới bảng thô sơ, không đúng quy chuẩn", "Mẫu in A4 chuẩn 100% Nghị định 30/2020/NĐ-CP kẹp vào học bạ."),
        ("Ứng dụng Trí tuệ Nhân tạo", "Không có", "Không có hoặc Chatbot trả lời chung chung", "Gemini Flash tích hợp Live RAG truy vấn trực tiếp CSDL 54 lớp & 120 phòng."),
        ("Khả năng mở rộng đa trường", "Không thể", "Thường cài đặt đơn lẻ từng máy chủ", "Kiến trúc sẵn sàng Multi-tenant SaaS phục vụ toàn bộ các trường trong tỉnh.")
    ]
    add_styled_table(doc, ["Tiêu chí nghiệp vụ", "Quản lý thủ công truyền thống", "Phần mềm quản lý thông thường", "Hệ thống EduKPI (Vượt trội)"], comparison_data, col_widths=[1.5, 1.6, 1.6, 2.3])

    add_custom_heading(doc, "4.2 Phân tích 5 Trụ cột Giá trị Đột phá khẳng định tính tiên phong", level=2)
    add_bullet(doc, "Thay vì tranh cãi về hạnh kiểm học sinh vào cuối kỳ, EduKPI biến nề nếp thành con số định lượng cụ thể. Mọi biên bản đều có hình ảnh minh chứng, mốc thời gian và được GVCN kiểm duyệt, tạo động lực rèn luyện tự giác cho học sinh.", bold_prefix="Trụ cột 1: Minh bạch hóa tuyệt đối kỷ luật học đường qua Thang đo KPI 100 điểm:")
    add_bullet(doc, "Sự kết hợp giữa Nút điểm danh siêu tốc 'Có mặt tất cả', Báo cáo Zalo tự động 22:15 và Cảnh báo đỏ Quá hạn vắng mặt thiết lập một mạng lưới bảo vệ 3 lớp, đảm bảo không một học sinh nào bị thất thoát hay gặp nguy hiểm ngoài KTX mà nhà trường không biết.", bold_prefix="Trụ cột 2: Tối đa hóa an ninh an toàn KTX ban đêm và ngăn ngừa rủi ro vắng mặt:")
    add_bullet(doc, "Khác biệt với các phần mềm thị trường thường kết xuất file excel lộn xộn, EduKPI tích hợp sẵn hệ thống mẫu in chuẩn thể thức văn bản quản lý nhà nước (Nghị định 30/2020/NĐ-CP), sẵn sàng phục vụ các đoàn thanh tra giáo dục và lưu trữ học bạ vĩnh viễn.", bold_prefix="Trụ cột 3: Chuẩn mực hóa thể thức hành chính theo Nghị định 30/2020/NĐ-CP:")
    add_bullet(doc, "Là một trong những giải pháp quản trị trường học đầu tiên tại Việt Nam tích hợp mô hình ngôn ngữ lớn (Google Gemini Flash) kết hợp kỹ thuật Live RAG, biến cơ sở dữ liệu trường học thành một trợ lý ảo am hiểu sâu sắc mọi ngóc ngách của nhà trường.", bold_prefix="Trụ cột 4: Tiên phong ứng dụng Trí tuệ Nhân tạo thông minh vào nhà trường:")
    add_bullet(doc, "Công cụ Master Excel và ma trận phân quyền 8 vai trò giúp nhà trường khởi tạo toàn bộ hệ thống cho gần 2.000 học sinh chỉ trong vòng 30 phút, tiết kiệm hàng trăm triệu đồng chi phí nhân sự và vận hành hàng năm.", bold_prefix="Trụ cột 5: Chi phí triển khai tối ưu và khả năng chuyển giao thần tốc:")

    doc.add_page_break()

    # =========================================================================
    # PHẦN V: HỒ SƠ ĐỀ ÁN THƯƠNG MẠI HÓA & CẨM NANG PHÁP LÝ TOÀN DIỆN
    # =========================================================================
    add_custom_heading(doc, "PHẦN V: HỒ SƠ ĐỀ ÁN THƯƠNG MẠI HÓA & CẨM NANG PHÁP LÝ TOÀN DIỆN", level=1)
    
    add_p(doc, "Để đưa hệ thống EduKPI từ một sáng kiến cấp trường ra thị trường thương mại toàn quốc (cung cấp cho các trường THPT, THCS, Trường Dân tộc nội trú và các Sở GD&ĐT), đơn vị phát triển phải tuân thủ đầy đủ hành lang pháp lý của Nhà nước Việt Nam về Thương mại điện tử, Bản quyền tác giả, Sở hữu trí tuệ và An toàn thông tin. Dưới đây là cẩm nang pháp lý và quy trình triển khai chi tiết từng bước:")

    add_custom_heading(doc, "5.1 Thủ tục Đăng ký / Thông báo Website TMĐT với Bộ Công Thương (online.gov.vn)", level=2)
    add_p(doc, "Căn cứ pháp lý: Nghị định số 52/2013/NĐ-CP ngày 16/05/2013, Nghị định số 85/2021/NĐ-CP ngày 25/09/2021 của Chính phủ và Thông tư số 47/2014/TT-BCT, Thông tư số 01/2022/TT-BCT của Bộ Công Thương.")
    
    add_bullet(doc, "Áp dụng nếu đơn vị/doanh nghiệp sở hữu website dùng để giới thiệu và bán trực tiếp các gói phần mềm, tài khoản dịch vụ EduKPI cho khách hàng (trường học, phụ huynh). Hình thức này thực hiện thủ tục THÔNG BÁO (nhận Logo Tích Xanh).", bold_prefix="Hình thức 1 - Website thương mại điện tử bán hàng:")
    add_bullet(doc, "Áp dụng nếu hệ thống EduKPI vận hành dưới dạng sàn dịch vụ đa trường (SaaS Platform), cho phép nhiều đơn vị giáo dục cùng tham gia tạo lập tài khoản, giao dịch, thanh toán phí bản quyền trực tuyến. Hình thức này bắt buộc phải làm thủ tục ĐĂNG KÝ VỚI BỘ CÔNG THƯƠNG (nhận Logo Tích Đỏ).", bold_prefix="Hình thức 2 - Website cung cấp dịch vụ thương mại điện tử:")

    add_callout(doc, [
        "QUY TRÌNH 4 BƯỚC ĐĂNG KÝ / THÔNG BÁO VỚI BỘ CÔNG THƯƠNG TẠI CỔNG ONLINE.GOV.VN:",
        "• Bước 1 (Đăng ký tài khoản): Truy cập Cổng thông tin Quản lý hoạt động TMĐT (www.online.gov.vn), đăng ký tài khoản thương nhân/tổ chức với mã số thuế và tải lên Giấy ĐKKD.",
        "• Bước 2 (Chờ cấp tài khoản): Trong vòng 3 ngày làm việc, Bộ Công Thương duyệt cấp tài khoản qua email.",
        "• Bước 3 (Nộp hồ sơ trực tuyến): Đăng nhập, chọn 'Thông báo website bán hàng' hoặc 'Đăng ký website cung cấp dịch vụ TMĐT', điền tên miền, thông tin đơn vị, đính kèm Đề án cung cấp dịch vụ, Quy chế hoạt động và các tài liệu liên quan.",
        "• Bước 4 (Thẩm định & Nhận mã nhúng): Trong vòng 3-7 ngày làm việc, Bộ Công Thương phê duyệt và cấp một đoạn mã nhúng (script). Đơn vị nhúng đoạn mã này vào footer website để hiển thị Logo Tích Xanh / Tích Đỏ liên kết xác thực chính thức về Bộ Công Thương."
    ], title="QUY TRÌNH NỘP HỒ SƠ TẠI CỔNG BỘ CÔNG THƯƠNG", box_type="law")

    add_custom_heading(doc, "Các chính sách pháp lý bắt buộc phải công khai trên website theo quy định:", level=3)
    add_bullet(doc, "Quy định rõ quyền, nghĩa vụ của nhà cung cấp dịch vụ phần mềm và khách hàng sử dụng (nhà trường, giáo viên, phụ huynh); quy định về sở hữu trí tuệ và giới hạn trách nhiệm.", bold_prefix="1. Điều khoản và Điều kiện sử dụng dịch vụ (Terms of Service - ToS):")
    add_bullet(doc, "Đặc biệt quan trọng: Phải tuân thủ tuyệt đối Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân. Nêu rõ mục đích thu thập dữ liệu học sinh, biện pháp mã hóa, cam kết không chia sẻ dữ liệu cho bên thứ ba vì mục đích thương mại và quyền yêu cầu xóa dữ liệu của phụ huynh.", bold_prefix="2. Chính sách Bảo vệ Dữ liệu Cá nhân (Privacy Policy):")
    add_bullet(doc, "Công khai các hình thức thanh toán (chuyển khoản ngân hàng, quét mã QR, cổng thanh toán trực tuyến VNPAY/MoMo), quy định về xuất hóa đơn điện tử VAT hợp pháp và chính sách hoàn trả phí dịch vụ nếu hệ thống không đáp ứng cam kết kỹ thuật.", bold_prefix="3. Chính sách Thanh toán & Hoàn tiền (Payment & Refund Policy):")
    add_bullet(doc, "Quy định thời gian hỗ trợ kỹ thuật 24/7, cam kết thời gian hoạt động hệ thống (SLA 99.9%), chính sách sao lưu dữ liệu định kỳ hàng ngày và quy trình xử lý sự cố.", bold_prefix="4. Chính sách Bảo hành, Bảo trì & Hỗ trợ Kỹ thuật:")
    add_bullet(doc, "Công khai đầu mối hotline, email tiếp nhận khiếu nại của phụ huynh, nhà trường và quy trình 3 bước xử lý giải quyết tranh chấp trong vòng tối đa 7 ngày làm việc.", bold_prefix="5. Quy trình tiếp nhận & Giải quyết Khiếu nại:")

    add_custom_heading(doc, "5.2 Thủ tục Đăng ký Bản quyền Tác giả cho Phần mềm tại Cục Bản quyền Tác giả", level=2)
    add_p(doc, "Căn cứ Luật Sở hữu trí tuệ năm 2005 (sửa đổi, bổ sung năm 2022) và Nghị định số 17/2023/NĐ-CP ngày 26/04/2023 của Chính phủ. Phần mềm máy tính được bảo hộ dưới hình thức tác phẩm văn học, nghệ thuật và khoa học.")
    add_bullet(doc, "Tờ khai đăng ký quyền tác giả theo mẫu quy định của Bộ Văn hóa, Thể thao và Du lịch.", bold_prefix="1. Thành phần hồ sơ bao gồm:");
    add_bullet(doc, "02 đĩa CD / DVD / USB chứa toàn bộ mã nguồn chương trình phần mềm (Source Code) và bản cài đặt.", bold_prefix="2. Thiết bị lưu trữ:");
    add_bullet(doc, "02 bản in giấy A4 toàn bộ giao diện phần mềm và tài liệu thuyết minh mô tả chức năng phần mềm.", bold_prefix="3. Tài liệu mô tả giao diện:");
    add_bullet(doc, "Văn bản cam đoan của tác giả về việc tự sáng tạo tác phẩm, không sao chép từ bất kỳ nguồn nào khác.", bold_prefix="4. Giấy cam đoan tác giả:");
    add_bullet(doc, "Hợp đồng giao việc hoặc Quyết định giao nhiệm vụ sáng tạo (nếu tác giả phát triển phần mềm thuộc tổ chức/doanh nghiệp).", bold_prefix="5. Văn bản giao quyền:");
    add_bullet(doc, "Nộp trực tiếp hoặc gửi qua bưu điện đến Cục Bản quyền Tác giả tại Hà Nội hoặc Văn phòng đại diện tại TP. Hồ Chí Minh, Đà Nẵng. Trong thời hạn 15 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ, Cục Bản quyền Tác giả sẽ cấp 'Giấy chứng nhận đăng ký quyền tác giả'.", bold_prefix="6. Nơi nộp và thời gian thụ lý:");

    add_custom_heading(doc, "5.3 Thủ tục Đăng ký Bảo hộ Nhãn hiệu & Logo tại Cục Sở hữu Trí tuệ", level=2)
    add_p(doc, "Để bảo vệ thương hiệu độc quyền EduKPI / SmartDormitory Pro trên thị trường, chống bị đối thủ sao chép tên gọi hoặc làm giả nhận diện, cần nộp đơn đăng ký bảo hộ nhãn hiệu tại Cục Sở hữu Trí tuệ (Bộ Khoa học và Công nghệ):")
    add_bullet(doc, "Phần mềm máy tính ghi sẵn; phần mềm ứng dụng di động; chương trình quản lý trường học tải về được.", bold_prefix="Nhóm 09 (Sản phẩm phần mềm):");
    add_bullet(doc, "Dịch vụ phần mềm dạng dịch vụ (SaaS); thiết kế, phát triển và cho thuê phần mềm máy tính; dịch vụ lưu trữ dữ liệu giáo dục trên nền tảng điện toán đám mây.", bold_prefix="Nhóm 42 (Dịch vụ công nghệ & SaaS):");
    add_bullet(doc, "Nộp Tờ khai đăng ký nhãn hiệu kèm 05 mẫu nhãn hiệu (Logo EduKPI). Quy trình trải qua: Thẩm định hình thức (01 tháng) -> Công bố đơn trên Công báo (02 tháng) -> Thẩm định nội dung (09-12 tháng) -> Cấp Văn bằng độc quyền bảo hộ có hiệu lực 10 năm trên toàn quốc (gia hạn không giới hạn).", bold_prefix="Quy trình cấp văn bằng:");

    add_custom_heading(doc, "5.4 Phương án Bảo đảm An toàn Thông tin Hệ thống theo Cấp độ (Nghị định 85/2016/NĐ-CP)", level=2)
    add_p(doc, "Căn cứ Nghị định số 85/2016/NĐ-CP ngày 01/07/2016 của Chính phủ về bảo đảm an toàn hệ thống thông tin theo cấp độ:")
    add_bullet(doc, "Hệ thống EduKPI quản lý thông tin cá nhân của hàng nghìn học sinh, phụ huynh và dữ liệu nề nếp nhà trường, được xác định thuộc CẤP ĐỘ 2 hoặc CẤP ĐỘ 3 tùy thuộc vào quy mô triển khai cho một trường hay toàn Sở GD&ĐT.", bold_prefix="Xác định cấp độ an toàn:");
    add_bullet(doc, "100% kết nối truyền tải dữ liệu qua giao thức mã hóa HTTPS/TLS 1.3; Mật khẩu người dùng được băm an toàn qua thuật toán Bcrypt Cost 12; Hệ thống sao lưu tự động (Automated Backup) lưu trữ đa vùng cách ly.", bold_prefix="Biện pháp kỹ thuật bắt buộc:");
    add_bullet(doc, "Lập Hồ sơ đề xuất cấp độ an toàn thông tin theo Mẫu của Bộ Thông tin và Truyền thông để trình cơ quan có thẩm quyền thẩm định và phê duyệt.", bold_prefix="Hồ sơ đề xuất cấp độ:");

    add_custom_heading(doc, "5.5 Mô hình Kinh doanh Thương mại & Cơ cấu Gói Dịch vụ Đề xuất (Pricing Model)", level=2)
    add_p(doc, "Đề xuất cơ cấu định giá linh hoạt theo mô hình SaaS (Software as a Service) thu phí thường niên hoặc triển khai trọn gói, tối ưu hóa ngân sách cho các nhà trường:")

    pricing_data = [
        ("Gói Cơ bản (Standard)\nTrường THPT Đại trà", "12.000.000 VNĐ / năm\n(~1.000.000 đ/tháng)", "Quản lý 50 lớp học, 2.000 học sinh, Điểm danh chuyên cần, Thang điểm KPI 100 nề nếp, Xuất báo cáo A4 Nghị định 30, Master Excel."),
        ("Gói Nâng cao (Dormitory Pro)\nTrường Chuyên / Dân tộc Nội trú", "24.000.000 VNĐ / năm\n(~2.000.000 đ/tháng)", "ĐẦY ĐỦ phân hệ KTX: 120 phòng 6 tầng, Điểm danh tối 1 chạm, Xuất Zalo 22:15, Đơn vắng mặt trực tuyến, CẢNH BÁO ĐỎ QUÁ HẠN, Bể 10 Key AI Gemini."),
        ("Gói Toàn diện (Enterprise)\nSở GD&ĐT / Cụm Liên trường", "Theo dự án đấu thầu\n(50 - 150 triệu VNĐ)", "Triển khai máy chủ riêng (Private Cloud Dedicated), quản trị Đa trường (Multi-tenant), phân quyền Sở/Phòng GD, tùy biến nhận diện thương hiệu riêng.")
    ]
    add_styled_table(doc, ["Gói giải pháp & Đối tượng", "Mức phí thương mại đề xuất", "Phạm vi tính năng & Cam kết dịch vụ"], pricing_data, col_widths=[2.0, 1.8, 2.7])

    doc.add_page_break()

    # =========================================================================
    # PHẦN VI: LỘ TRÌNH TRIỂN KHAI & HIỆU QUẢ KINH TẾ - XÃ HỘI
    # =========================================================================
    add_custom_heading(doc, "PHẦN VI: LỘ TRÌNH TRIỂN KHAI & HIỆU QUẢ KINH TẾ - XÃ HỘI", level=1)
    
    add_custom_heading(doc, "6.1 Lộ trình triển khai 4 giai đoạn chuẩn hóa", level=2)
    
    timeline_data = [
        ("Giai đoạn 1\n(01 - 03/2026)", "Hoàn thiện sản phẩm lõi & Thử nghiệm tại THPT Chuyên Hùng Vương", "Vận hành thử nghiệm 54 lớp, 120 phòng KTX; tinh chỉnh thuật toán AI Gemini và quy trình điểm danh Zalo 22:15."),
        ("Giai đoạn 2\n(04 - 06/2026)", "Hoàn tất hồ sơ pháp lý & Đăng ký sở hữu trí tuệ", "Nộp hồ sơ Đăng ký Bản quyền tác giả, nộp đơn Nhãn hiệu Cục SHTT và Đăng ký website TMĐT Cổng online.gov.vn."),
        ("Giai đoạn 3\n(07 - 09/2026)", "Đóng gói phiên bản thương mại SaaS & Mở rộng thị trường", "Phát hành phiên bản đám mây đa trường học, triển khai thử nghiệm tại 5 trường THPT Chuyên và Dân tộc nội trú khu vực Trung du miền núi phía Bắc."),
        ("Giai đoạn 4\n(10/2026 trở đi)", "Thương mại hóa diện rộng & Đấu thầu dự án Sở GD&ĐT", "Mở rộng kinh doanh toàn quốc, cung cấp giải pháp cho các Sở GD&ĐT quản lý tập trung toàn bộ KTX và nền nếp học sinh.")
    ]
    add_styled_table(doc, ["Thời gian thực hiện", "Nhiệm vụ trọng tâm giai đoạn", "Kết quả đầu ra dự kiến (Deliverables)"], timeline_data, col_widths=[1.5, 2.2, 2.8])

    add_custom_heading(doc, "6.2 Đánh giá Hiệu quả Quản lý, Giáo dục và Tiết kiệm Ngân sách", level=2)
    add_bullet(doc, "Cắt giảm 90% chi phí mua sổ sách, giấy in điểm danh, phiếu xin nghỉ phép hàng năm (tiết kiệm ước tính từ 30 - 50 triệu đồng/năm cho mỗi trường).", bold_prefix="1. Tiết kiệm tài chính và ngân sách nhà trường:");
    add_bullet(doc, "Giải phóng hoàn toàn giáo viên chủ nhiệm và ban quản sinh khỏi các công việc cộng sổ, lập bảng biểu thủ công, tiết kiệm hơn 500 giờ làm việc hành chính mỗi năm.", bold_prefix="2. Tiết kiệm thời gian và nguồn lực nhân sự:");
    add_bullet(doc, "Nhờ cơ chế Báo cáo Zalo tự động 22:15 và Cảnh báo Đỏ Quá Hạn, tỷ lệ học sinh vi phạm giờ giới nghiêm giảm 95%, chấm dứt hoàn toàn tình trạng trốn KTX ban đêm.", bold_prefix="3. Nâng cao 95% mức độ an toàn an ninh nội trú:");
    add_bullet(doc, "Thang điểm 100 KPI giúp học sinh tự theo dõi và điều chỉnh hành vi của mình, xây dựng môi trường học đường văn minh, chuẩn mực và kỷ cương.", bold_prefix="4. Giá trị giáo dục và rèn luyện đạo đức:");

    add_custom_heading(doc, "6.3 Kết luận & Cam kết Chất lượng Dịch vụ", level=2)
    add_p(doc, "Hệ thống Quản lý Ký túc xá, Điểm danh Tập trung & Đánh giá KPI Nền nếp Học sinh Toàn diện (EduKPI) không chỉ là một giải pháp công nghệ đơn thuần, mà là một bước chuyển đổi tư duy quản trị trường học từ phương thức truyền thống sang mô hình Trường học Thông minh (Smart Campus). Với tính hoàn thiện cao, khả năng mở rộng linh hoạt và tuân thủ chặt chẽ các quy định pháp luật của Nhà nước, dự án hoàn toàn đủ điều kiện để nghiệm thu xuất sắc, đăng ký bảo hộ sở hữu trí tuệ và thương mại hóa thành công trên quy mô toàn quốc.")
    
    add_callout(doc, [
        "CAM KẾT CHẤT LƯỢNG VÀ TRÁCH NHIỆM BẢO HÀNH DỊCH VỤ:",
        "• Cam kết độ sẵn sàng hệ thống (Uptime): Đạt tối thiểu 99.9% thời gian hoạt động ổn định trong năm.",
        "• Cam kết bảo mật dữ liệu: Tuyệt đối tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân học sinh và giáo viên.",
        "• Hỗ trợ kỹ thuật: Phục vụ 24/7/365, tiếp nhận và xử lý sự cố trong vòng tối đa 30 phút.",
        "• Nâng cấp tính năng: Miễn phí cập nhật toàn bộ các tính năng mới và mẫu văn bản khi có quy định mới của Bộ GD&ĐT."
    ], title="CAM KẾT DỊCH VỤ TỪ BAN PHÁT TRIỂN DỰ ÁN EDUKPI", box_type="success")

    # Output filename
    output_filename = "THUYET_MINH_DU_AN_VA_DE_AN_THUONG_MAI_HOA_EDUKPI.docx"
    doc.save(output_filename)
    print(f"Document successfully created: {output_filename}")

if __name__ == "__main__":
    build_document()
