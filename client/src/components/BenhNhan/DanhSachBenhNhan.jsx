import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DanhSachBenhNhan() {
    const [danhSach, setDanhSach] = useState([]);
    const [dangTai, setDangTai] = useState(true);

    useEffect(() => {
        const layDanhSach = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/patients');
                setDanhSach(response.data);
                setDangTai(false);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu:', error);
                setDangTai(false);
            }
        };

        layDanhSach();
    }, []);

    if (dangTai) return <div>Đang tải...</div>;

    return (
        <div>
            <h2>Danh sách bệnh nhân</h2>
            <table>
                <thead>
                    <tr>
                        <th>Họ tên</th>
                        <th>Số điện thoại</th>
                        <th>Giới tính</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {danhSach.map(benhNhan => (
                        <tr key={benhNhan.id}>
                            <td>{benhNhan.hoTen}</td>
                            <td>{benhNhan.soDienThoai}</td>
                            <td>{benhNhan.gioiTinh}</td>
                            <td>
                                <button>Sửa</button>
                                <button>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}