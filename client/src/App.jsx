import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerLayout from './components/customer/CustomerLayout';
import DoctorLayout from './components/doctor/DoctorLayout';
import AdminLayout from './components/admin/AdminLayout';
import HomePage from './pages/customer/HomePage';
import Dashboard from './pages/customer/Dashboard';
import Booking from './pages/customer/Booking';
import MyAppointments from './pages/customer/MyAppointments';
import Services from './pages/customer/Services';
import DoctorList from './pages/customer/DoctorList';
import DoctorDetail from './pages/customer/DoctorDetail';
import PublicDoctorList from './pages/public/DoctorList';
import PublicDoctorDetail from './pages/public/DoctorDetail';
import PublicServiceList from './pages/public/ServiceList';
import About from './pages/customer/About';
import Contact from './pages/customer/Contact';
import Login from './pages/Login';
import Register from './pages/Register';

// Doctor Pages - NEW Design
import DoctorDashboardNew from './pages/doctor/DoctorDashboardNew';
import AppointmentsList from './pages/doctor/AppointmentsList';
import ExaminationPage from './pages/doctor/ExaminationPage';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorScheduleView from './pages/doctor/DoctorScheduleView';
import PatientMedicalHistory from './pages/doctor/PatientMedicalHistory';
import PatientProfile from './pages/customer/PatientProfile';
import MedicalHistory from './pages/customer/MedicalHistory';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminAppointments from './pages/admin/Appointments';
import AdminDoctorsManagement from './pages/admin/AdminDoctors';
import AdminDoctorManagement from './pages/admin/AdminDoctorManagement';  // ✅ NEW: Combined Doctors + Schedule
import AdminPatientsManagement from './pages/admin/AdminPatients';
import AdminSpecialties from './pages/admin/AdminSpecialties';
import AdminRooms from './pages/admin/AdminRooms';
import AdminServices from './pages/admin/Services';
import AdminReports from './pages/admin/AdminReports';
import AdminDoctorSchedule from './pages/admin/AdminDoctorSchedule';
import AdminTimeSlots from './pages/admin/AdminTimeSlots';
import DrugManagement from './pages/admin/DrugManagement';  // ✅ NEW

export default function App() {
    return (
        <Router>
            <Routes>
                {/* ✅ Customer Routes - Public (guest + patient) */}
                <Route path="/" element={
                    <ProtectedRoute requiredRole="any">
                        <CustomerLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<HomePage />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="booking" element={<Booking />} />
                    <Route path="my-appointments" element={<MyAppointments />} />
                    <Route path="services" element={<PublicServiceList />} />
                    <Route path="doctors" element={<PublicDoctorList />} />
                    <Route path="doctors/:id" element={<PublicDoctorDetail />} />
                    <Route path="profile" element={<PatientProfile />} />
                    <Route path="medical-history" element={<MedicalHistory />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                </Route>

                {/* ✅ Doctor Routes - CHỈ DOCTOR */}
                <Route path="/doctor-portal" element={
                    <ProtectedRoute requiredRole="doctor">
                        <DoctorLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<DoctorDashboardNew />} />
                    <Route path="appointments" element={<AppointmentsList />} />
                    <Route path="examination" element={<ExaminationPage />} />
                    <Route path="schedule" element={<DoctorScheduleView />} />
                    <Route path="profile" element={<DoctorProfile />} />
                    <Route path="patient-history/:patientId" element={<PatientMedicalHistory />} />
                </Route>

                {/* ✅ Admin Routes - CHỈ ADMIN */}
                <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin">
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="appointments" element={<AdminAppointments />} />
                    <Route path="doctors" element={<AdminDoctorManagement />} />
                    <Route path="doctor-schedules" element={<AdminDoctorSchedule />} />
                    <Route path="time-slots" element={<AdminTimeSlots />} />
                    <Route path="patients" element={<AdminPatientsManagement />} />
                    <Route path="specialties" element={<AdminSpecialties />} />
                    <Route path="rooms" element={<AdminRooms />} />
                    <Route path="services" element={<AdminServices />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="drugs" element={<DrugManagement />} />
                </Route>

                {/* Auth Routes - Guest only */}
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