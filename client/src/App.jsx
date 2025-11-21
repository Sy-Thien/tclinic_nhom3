import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerLayout from './components/customer/CustomerLayout';
import DoctorLayout from './components/doctor/DoctorLayout';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/customer/Dashboard';
import Booking from './pages/customer/Booking';
import MyAppointments from './pages/customer/MyAppointments';
import Services from './pages/customer/Services';
import DoctorList from './pages/customer/DoctorList';
import DoctorDetail from './pages/customer/DoctorDetail';
import About from './pages/customer/About';
import Contact from './pages/customer/Contact';
import Login from './pages/Login';
import Register from './pages/Register';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorPatients from './pages/doctor/Patients';
import DoctorSchedule from './pages/doctor/Schedule';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminAppointments from './pages/admin/Appointments';
import AdminDoctorsManagement from './pages/admin/AdminDoctors';
import AdminPatientsManagement from './pages/admin/AdminPatients';
import AdminSpecialties from './pages/admin/AdminSpecialties';
import AdminRooms from './pages/admin/AdminRooms';
import AdminServices from './pages/admin/Services';
import AdminReports from './pages/admin/AdminReports';
import AdminDoctorSchedule from './pages/admin/AdminDoctorSchedule';

export default function App() {
    return (
        <Router>
            <Routes>
                {/* Customer Routes */}
                <Route path="/" element={<CustomerLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="booking" element={<Booking />} />
                    <Route path="my-appointments" element={<MyAppointments />} />
                    <Route path="services" element={<Services />} />
                    <Route path="doctors" element={<DoctorList />} />
                    <Route path="doctors/:id" element={<DoctorDetail />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                </Route>

                {/* Doctor Routes */}
                <Route path="/doctor" element={<DoctorLayout />}>
                    <Route index element={<DoctorDashboard />} />
                    <Route path="appointments" element={<DoctorAppointments />} />
                    <Route path="patients" element={<DoctorPatients />} />
                    <Route path="schedule" element={<DoctorSchedule />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="appointments" element={<AdminAppointments />} />
                    <Route path="doctors" element={<AdminDoctorsManagement />} />
                    <Route path="patients" element={<AdminPatientsManagement />} />
                    <Route path="specialties" element={<AdminSpecialties />} />
                    <Route path="rooms" element={<AdminRooms />} />
                    <Route path="services" element={<AdminServices />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="doctor-schedules" element={<AdminDoctorSchedule />} />
                </Route>

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 404 Page */}
                <Route path="*" element={
                    <div style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        background: '#f5f7fa'
                    }}>
                        <h1 style={{ fontSize: '4rem', color: '#667eea' }}>404</h1>
                        <p style={{ fontSize: '1.5rem', color: '#4a5568', marginBottom: '2rem' }}>
                            Trang không tồn tại
                        </p>
                        <a href="/" style={{
                            padding: '1rem 2rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 600
                        }}>
                            Về trang chủ
                        </a>
                    </div>
                } />
            </Routes>
        </Router>
    );
}