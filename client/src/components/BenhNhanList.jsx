import { useEffect, useState } from 'react';
import axios from 'axios';

export default function BenhNhanList() {
    const [ds, setDs] = useState([]);
    useEffect(() => {
        axios.get('http://localhost:5000/api/benhnhan')
            .then(r => setDs(r.data))
            .catch(console.error);
    }, []);
    return (
        <div>
            <h2>Danh sách bệnh nhân</h2>
            <pre>{JSON.stringify(ds, null, 2)}</pre>
        </div>
    );
}