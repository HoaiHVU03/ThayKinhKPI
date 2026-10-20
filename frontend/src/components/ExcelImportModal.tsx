// frontend/src/components/ExcelImportModal.tsx

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Modal } from './Modal';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  FileUp,
  X,
  RefreshCw,
} from 'lucide-react';

export interface ColumnMapping {
  key: string;
  label: string;
  aliases: string[];
  required?: boolean;
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  templateFileName: string;
  sampleTemplateData: Record<string, any>[];
  columns: ColumnMapping[];
  onImport: (items: any[]) => Promise<{ success_count: number; failed_count: number; errors?: string[] }>;
  onSuccess?: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  templateFileName,
  sampleTemplateData,
  columns,
  onImport,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success_count: number;
    failed_count: number;
    errors?: string[];
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(sampleTemplateData);
      
      // Auto column widths
      const colWidths = Object.keys(sampleTemplateData[0] || {}).map((k) => ({
        wch: Math.max(k.length + 4, 15),
      }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Du_Lieu');
      XLSX.writeFile(wb, `${templateFileName}.xlsx`);
    } catch (err) {
      console.error('Error generating template:', err);
    }
  };

  // Process uploaded Excel / CSV file
  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);
    setValidationErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setValidationErrors(['File Excel trống hoặc không có dòng dữ liệu hợp lệ']);
          setParsedData([]);
          return;
        }

        // Map columns according to aliases
        const errors: string[] = [];
        const normalizedItems: any[] = [];

        rawJson.forEach((row, idx) => {
          const item: Record<string, any> = {};
          const rowKeys = Object.keys(row);

          columns.forEach((col) => {
            // Find matched header
            const matchedKey = rowKeys.find((rk) => {
              const clean = rk.trim().toLowerCase();
              return col.aliases.some((alias) => clean === alias.toLowerCase());
            });

            if (matchedKey !== undefined) {
              let val = row[matchedKey];
              // Handle Excel date objects
              if (val instanceof Date) {
                const yyyy = val.getFullYear();
                const mm = String(val.getMonth() + 1).padStart(2, '0');
                const dd = String(val.getDate()).padStart(2, '0');
                val = `${yyyy}-${mm}-${dd}`;
              }
              item[col.key] = typeof val === 'string' ? val.trim() : val;
            } else {
              item[col.key] = '';
            }

            // Validate required
            if (col.required && (!item[col.key] || item[col.key] === '')) {
              errors.push(`Dòng ${idx + 2}: Thiếu "${col.label}"`);
            }
          });

          normalizedItems.push(item);
        });

        setParsedData(normalizedItems);
        setValidationErrors(errors);
      } catch (err: any) {
        setValidationErrors([`Lỗi khi đọc file: ${err.message || 'File không đúng định dạng Excel/CSV'}`]);
        setParsedData([]);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0) return;
    setImporting(true);
    try {
      const res = await onImport(parsedData);
      setImportResult(res);
      if (res.success_count > 0 && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setImportResult({
        success_count: 0,
        failed_count: parsedData.length,
        errors: [err.response?.data?.message || err.message || 'Lỗi hệ thống khi nhập dữ liệu'],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="2xl">
      <div className="space-y-4 text-xs text-slate-700">
        <p className="text-slate-600 leading-relaxed">{description}</p>

        {/* Action Bar: Download Sample & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#0e3a7c]" />
            <span className="font-semibold text-[#0e3a7c]">Mẫu file chuẩn (.xlsx / .csv):</span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0e3a7c] hover:bg-blue-100 font-bold border border-blue-300 rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Tải file Excel mẫu
          </button>
        </div>

        {/* Drag & Drop Upload Zone */}
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#0e3a7c] bg-blue-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-[#0e3a7c] hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0e3a7c] flex items-center justify-center">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-[#0e3a7c] hover:underline">Nhấp để chọn file Excel/CSV</span>
                <span className="text-slate-500"> hoặc kéo thả file vào đây</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hỗ trợ định dạng: .xlsx, .xls, .csv (Tự động nhận diện cột tiếng Việt có dấu hoặc không dấu)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900">{file.name}</div>
                <div className="text-[11px] text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB • {parsedData.length} dòng dữ liệu được nhận diện
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={resetState}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              title="Đổi file khác"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Validation Errors Warnings */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Cảnh báo dữ liệu ({validationErrors.length} phát hiện):
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] max-h-24 overflow-y-auto">
              {validationErrors.slice(0, 10).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {validationErrors.length > 10 && (
                <li className="font-semibold italic">...và còn {validationErrors.length - 10} cảnh báo khác</li>
              )}
            </ul>
          </div>
        )}

        {/* Live Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span>Xem trước 5 dòng đầu tiên:</span>
              <span className="text-[11px] font-normal text-slate-500">
                Hiển thị 5 / {parsedData.length} dòng
              </span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto max-h-52">
                <table className="w-full text-left text-[11px] text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">STT</th>
                      {columns.map((col) => (
                        <th key={col.key} className="px-3 py-2 whitespace-nowrap">
                          {col.label} {col.required && <span className="text-red-500">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                        {columns.map((col) => (
                          <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                            {row[col.key] !== undefined && row[col.key] !== '' ? (
                              String(row[col.key])
                            ) : (
                              <span className="text-slate-300 italic">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Import Results Banner */}
        {importResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              importResult.failed_count === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              {importResult.failed_count === 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Nhập dữ liệu hoàn tất thành công!
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Nhập hoàn tất với một số lưu ý:
                </>
              )}
            </div>
            <div className="space-y-0.5 text-xs">
              <div>✓ Nhập thành công: <strong>{importResult.success_count}</strong> bản ghi</div>
              {importResult.failed_count > 0 && (
                <div>✗ Không thành công: <strong>{importResult.failed_count}</strong> bản ghi</div>
              )}
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-2 pt-2 border-t border-amber-200/60">
                <div className="font-semibold text-red-700 text-[11px] mb-1">Chi tiết lỗi từ máy chủ:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-600 max-h-28 overflow-y-auto">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
          >
            {importResult ? 'Đóng cửa sổ' : 'Hủy bỏ'}
          </button>
          {parsedData.length > 0 && !importResult && (
            <button
              type="button"
              disabled={importing}
              onClick={handleImportSubmit}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang xử lý nhập...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Xác nhận nhập {parsedData.length} bản ghi
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
