import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DoctorsList() {
    const [list, setList] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('http://localhost:5000/api/admin/doctors', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setList(r.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h2>Danh sách bác sĩ</h2>
            <pre>{JSON.stringify(list, null, 2)}</pre>
        </div>
    );
}