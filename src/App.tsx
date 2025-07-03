import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast, { Toaster } from 'react-hot-toast';

interface ResultRecord {
  hoTen: string;
  ngaySinh: string;
  ngayTiem: string;
  tenVaccine: string;
  diaChi: string;
  sdt: string;
  nguoiLienHe: string;
}

function App() {
  const [fileCTC, setFileCTC] = useState<File | null>(null);
  const [fileQAS, setFileQAS] = useState<File | null>(null);
  const [dupFile, setDupFile] = useState<File | null>(null);
  const [data, setData] = useState<ResultRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiType, setApiType] = useState<'ctc' | 'pm' | 'dup'>('ctc');
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleSubmit = async (type: 'ctc' | 'pm') => {
    if (!fileCTC || !fileQAS) {
      toast.error("Vui lòng chọn đủ 2 file Excel!");
      return;
    }

    const formData = new FormData();
    formData.append("fileCTC", fileCTC);
    formData.append("fileQAS", fileQAS);

    try {
      setLoading(true);
      const endpoint = type === 'ctc' ? 'checkctc' : 'checkpm';
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/${endpoint}`, formData);
      setData(response.data);
      setApiType(type);
      toast.success("Đối chiếu thành công!");
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi xử lý.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = Object.keys(data[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...data.map((row) => (row[key as keyof typeof row]?.toString().length || 0))
      );
      return { wch: maxLen + 2 };
    });
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kết quả");

    const now = new Date();
    const timestamp = now.toLocaleString("vi-VN", { hour12: false }).replace(/[^0-9]/g, "");
    const filename = `ketqua-${apiType}-${timestamp}.xlsx`;

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), filename);
  };

  const handleDuplicateCheck = async () => {
    if (!dupFile) {
      toast.error("Vui lòng chọn file Excel!");
      return;
    }

    const formData = new FormData();
    formData.append("file", dupFile);

    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/checkdup`, formData);
      setData(response.data);
      setApiType("dup");
      toast.success("Kiểm tra trùng thành công!");
      setIsPopupOpen(false);
    } catch (err) {
      toast.error("Lỗi khi kiểm tra trùng dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">So sánh dữ liệu tiêm vaccine</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-medium mb-1 text-gray-700">
            File CTC <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFileCTC(e.target.files?.[0] || null)}
            className="block w-full p-2 border rounded shadow-sm bg-white"
          />
          {fileCTC && <p className="text-sm text-green-600 mt-1">Đã chọn: {fileCTC.name}</p>}
        </div>

        <div>
          <label className="block font-medium mb-1 text-gray-700">
            File PM <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFileQAS(e.target.files?.[0] || null)}
            className="block w-full p-2 border rounded shadow-sm bg-white"
          />
          {fileQAS && <p className="text-sm text-green-600 mt-1">Đã chọn: {fileQAS.name}</p>}
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => handleSubmit("ctc")}
        >
          Check CTC
        </button>
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => handleSubmit("pm")}
        >
          Check PM
        </button>
        <button
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          onClick={() => setIsPopupOpen(true)}
        >
          Check Trùng
        </button>
        {data.length > 0 && (
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            onClick={handleExport}
          >
            Xuất Excel
          </button>
        )}
      </div>

      {loading && <p>Đang xử lý...</p>}

      {data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Họ Tên</th>
                <th className="border px-2 py-1">Ngày Sinh</th>
                <th className="border px-2 py-1">Ngày Tiêm</th>
                <th className="border px-2 py-1">Vaccine</th>
                <th className="border px-2 py-1">Địa chỉ</th>
                <th className="border px-2 py-1">SĐT</th>
                <th className="border px-2 py-1">Người LH</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{row.hoTen}</td>
                  <td className="border px-2 py-1">{row.ngaySinh}</td>
                  <td className="border px-2 py-1">{row.ngayTiem}</td>
                  <td className="border px-2 py-1">{row.tenVaccine}</td>
                  <td className="border px-2 py-1">{row.diaChi}</td>
                  <td className="border px-2 py-1">{row.sdt}</td>
                  <td className="border px-2 py-1">{row.nguoiLienHe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Kiểm tra dữ liệu trùng</h2>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setDupFile(e.target.files?.[0] || null)}
              className="block w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setIsPopupOpen(false)}
              >
                Hủy
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                onClick={handleDuplicateCheck}
              >
                Kiểm tra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
