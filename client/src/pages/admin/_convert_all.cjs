const fs = require('fs');

// Generic conversion function
function convertGeneric(content, options) {
    let c = content;

    // Remove const from all function declarations inside the component
    c = c.replace(/^(    )const (\w+) = (async )?\(/gm, '$1$2 = $3(');

    // Simple boolean/null setters
    const boolSetters = [
        'loading', 'loadingDoctors', 'showConfirmModal', 'showCancelModal',
        'showAssignModal', 'showAssignNewModal', 'showCreateModal', 'showDeleteModal',
        'showModal', 'showDoctorModal', 'showScheduleModal', 'showEditModal',
        'showDetailModal', 'showMedicalRecordModal', 'showEditRecordModal',
        'noAvailableDoctor'
    ];
    for (const name of boolSetters) {
        const setter = 'set' + name.charAt(0).toUpperCase() + name.slice(1);
        c = c.replace(new RegExp(setter + '\\(true\\)', 'g'), `this.setState({ ${name}: true })`);
        c = c.replace(new RegExp(setter + '\\(false\\)', 'g'), `this.setState({ ${name}: false })`);
        c = c.replace(new RegExp(setter + '\\(null\\)', 'g'), `this.setState({ ${name}: null })`);
    }

    // Null/empty setters
    const nullSetters = [
        'selectedDoctor', 'selectedPatient', 'selectedSpecialty', 'selectedRoom',
        'selectedRecord', 'editingSchedule', 'editingId', 'doctorSchedule',
        'doctorTimeSlots', 'stats'
    ];
    for (const name of nullSetters) {
        const setter = 'set' + name.charAt(0).toUpperCase() + name.slice(1);
        c = c.replace(new RegExp(setter + '\\(null\\)', 'g'), `this.setState({ ${name}: null })`);
        c = c.replace(new RegExp(setter + '\\(\\[\\]\\)', 'g'), `this.setState({ ${name}: [] })`);
    }

    // String setters with quoted values
    const strSetterNames = [
        'selectedDoctor', 'selectedTimeSlot', 'cancelReason', 'searchTerm',
        'searchDoctor', 'selectedSpecialty', 'filterStatus', 'filterFloor',
        'filterSpecialty', 'selectedTab', 'activeTab', 'viewMode', 'filterStatus'
    ];
    for (const name of strSetterNames) {
        const setter = 'set' + name.charAt(0).toUpperCase() + name.slice(1);
        c = c.replace(new RegExp(setter + "\\('([^']*)'\\)", 'g'), `this.setState({ ${name}: '$1' })`);
        c = c.replace(new RegExp(setter + '\\("([^"]*)"\\)', 'g'), `this.setState({ ${name}: "$1" })`);
    }

    // Variable argument setters
    const varSetterNames = [
        'selectedDoctor', 'selectedAppointment', 'selectedPatient', 'selectedSpecialty',
        'selectedRoom', 'selectedRecord', 'selectedTab', 'activeTab', 'editingSchedule',
        'editingId', 'viewMode'
    ];
    for (const name of varSetterNames) {
        const setter = 'set' + name.charAt(0).toUpperCase() + name.slice(1);
        // Match setter(variableName) but not setter({...}) or setter(String(...)) etc.
        c = c.replace(new RegExp(setter + '\\((\\w+)\\)', 'g'), `this.setState({ ${name}: $1 })`);
    }

    // Complex expression setters
    c = c.replace(/setSelectedDoctor\(String\(doc\.id\)\)/g, 'this.setState({ selectedDoctor: String(doc.id) })');
    c = c.replace(/setSelectedSpecialty\(String\(([^)]+)\)\)/g, 'this.setState({ selectedSpecialty: String($1) })');

    // Response data setters
    const responseSetters = {
        'setAppointments(response.data.bookings || [])': 'this.setState({ appointments: response.data.bookings || [] })',
        'setDoctors(response.data || [])': 'this.setState({ doctors: response.data || [] })',
        'setDoctors(response.data)': 'this.setState({ doctors: response.data })',
        'setSpecialties(response.data || [])': 'this.setState({ specialties: response.data || [] })',
        'setSpecialties(response.data)': 'this.setState({ specialties: response.data })',
        'setAvailableDoctors(response.data.doctors || [])': 'this.setState({ availableDoctors: response.data.doctors || [] })',
        'setAvailableDoctors([])': 'this.setState({ availableDoctors: [] })',
        'setAvailableDoctorsForAssignment(response.data.availableDoctors || [])': 'this.setState({ availableDoctorsForAssignment: response.data.availableDoctors || [] })',
        'setAvailableDoctorsForAssignment([])': 'this.setState({ availableDoctorsForAssignment: [] })',
        'setNoAvailableDoctor(response.data.noAvailableDoctor || false)': 'this.setState({ noAvailableDoctor: response.data.noAvailableDoctor || false })',
        "setBookingDayOfWeek(response.data.booking?.dayOfWeek || '')": "this.setState({ bookingDayOfWeek: response.data.booking?.dayOfWeek || '' })",
        'setDoctorTimeSlots(response.data.data)': 'this.setState({ doctorTimeSlots: response.data.data })',
        'setDoctorTimeSlots(null)': 'this.setState({ doctorTimeSlots: null })',
        'setDoctorStatus(response.data)': 'this.setState({ doctorStatus: response.data })',
        'setStats(response.data)': 'this.setState({ stats: response.data })',
        'setRooms(response.data)': 'this.setState({ rooms: response.data })',
        'setAllSchedules(response.data)': 'this.setState({ allSchedules: response.data })',
        'setPatients(response.data)': 'this.setState({ patients: response.data })',
        'setDoctorSchedule(response.data)': 'this.setState({ doctorSchedule: response.data })',
        'setDoctorSchedule([])': 'this.setState({ doctorSchedule: [] })',
        'setRecentBookings(response.data.bookings || [])': 'this.setState({ recentBookings: response.data.bookings || [] })',
        'setPatientHistory(response.data)': 'this.setState({ patientHistory: response.data })',
        'setSelectedSpecialty(response.data)': 'this.setState({ selectedSpecialty: response.data })',
    };
    for (const [old, rep] of Object.entries(responseSetters)) {
        c = c.split(old).join(rep);
    }

    // Callback setters with prev spread
    c = c.replace(/setFilters\(prev => \(\{ \.\.\.prev, \[name\]: value \}\)\)/g,
        'this.setState(prev => ({ filters: { ...prev.filters, [name]: value } }))');
    c = c.replace(/setFormData\(prev => \(\{ \.\.\.prev, \[name\]: value \}\)\)/g,
        'this.setState(prev => ({ formData: { ...prev.formData, [name]: value } }))');
    c = c.replace(/setFormData\(prev => \(\{ \.\.\.prev, \[field\]: value \}\)\)/g,
        'this.setState(prev => ({ formData: { ...prev.formData, [field]: value } }))');
    c = c.replace(/setFormData\(prev => \(\{ \.\.\.prev, \[field\]: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\] \}\)\)/g,
        "this.setState(prev => ({ formData: { ...prev.formData, [field]: new Date().toISOString().split('T')[0] } }))");

    // Inline setFormData in JSX: setFormData({ ...formData, key: val })
    c = c.replace(/setFormData\(\{ \.\.\.formData, (\w+): ([^}]+)\}\)/g,
        'this.setState(prev => ({ formData: { ...prev.formData, $1: $2} }))');
    // setFormData with full object (multi-line reset patterns)
    c = c.replace(
        /setFormData\(\{\s*patient_name: '',\s*patient_email: '',\s*patient_phone: '',\s*patient_gender: 'male',\s*patient_dob: '',\s*patient_address: '',\s*specialty_id: '',\s*doctor_id: '',\s*appointment_date: '',\s*appointment_time: '',\s*symptoms: '',\s*note: ''\s*\}\)/gs,
        "this.setState({ formData: { patient_name: '', patient_email: '', patient_phone: '', patient_gender: 'male', patient_dob: '', patient_address: '', specialty_id: '', doctor_id: '', appointment_date: '', appointment_time: '', symptoms: '', note: '' } })"
    );

    // setRecordFormData with spread
    c = c.replace(/setRecordFormData\(\{ \.\.\.recordFormData, (\w+): ([^}]+)\}\)/g,
        'this.setState(prev => ({ recordFormData: { ...prev.recordFormData, $1: $2} }))');

    // setFilter with spread
    c = c.replace(/setFilter\(\{ \.\.\.filter, (\w+): ([^}]+)\}\)/g,
        'this.setState(prev => ({ filter: { ...prev.filter, $1: $2} }))');
    c = c.replace(/setFilter\(\{ status: '', date: ([^,]+), doctor_id: '' \}\)/g,
        "this.setState({ filter: { status: '', date: $1, doctor_id: '' } })");
    c = c.replace(/setFilter\(\{ status: '', date: '', doctor_id: '' \}\)/g,
        "this.setState({ filter: { status: '', date: '', doctor_id: '' } })");

    // setPagination with callback
    c = c.replace(
        /setPagination\(prev => \(\{\s*\.\.\.prev,\s*page: response\.data\.page \|\| 1,\s*totalPages: response\.data\.totalPages \|\| 1,\s*total: response\.data\.total \|\| 0\s*\}\)\)/gs,
        'this.setState(prev => ({ pagination: { ...prev.pagination, page: response.data.page || 1, totalPages: response.data.totalPages || 1, total: response.data.total || 0 } }))'
    );

    // setCancelReason with expression
    c = c.replace(/setCancelReason\(([^)]+)\)/g, 'this.setState({ cancelReason: $1 })');

    // setSearchTerm with expression
    c = c.replace(/setSearchTerm\(([^)]+)\)/g, 'this.setState({ searchTerm: $1 })');
    c = c.replace(/setSearchDoctor\(([^)]+)\)/g, 'this.setState({ searchDoctor: $1 })');
    c = c.replace(/setFilterStatus\(([^)]+)\)/g, 'this.setState({ filterStatus: $1 })');
    c = c.replace(/setFilterFloor\(([^)]+)\)/g, 'this.setState({ filterFloor: $1 })');
    c = c.replace(/setFilterSpecialty\(([^)]+)\)/g, 'this.setState({ filterSpecialty: $1 })');

    // setMedicalRecords  
    c = c.replace(/setMedicalRecords\(response\.data\.medicalRecords \|\| \[\]\)/g, 'this.setState({ medicalRecords: response.data.medicalRecords || [] })');
    c = c.replace(/setMedicalRecords\(\[\]\)/g, 'this.setState({ medicalRecords: [] })');

    // Remaining setFormData object assignments (for edit modals with explicit objects)
    // These are multi-line, we handle them by matching the entire block
    // setFormData({ email: doctor.email, ...}) patterns
    c = c.replace(/setFormData\(\{(\s*\w+:)/g, 'this.setState({ formData: {$1');
    // Need to close the extra brace - this is handled by the existing closing
    // Actually this is tricky. Let me handle specific patterns.

    // setScheduleFormData
    c = c.replace(/setScheduleFormData\(\{/g, 'this.setState({ scheduleFormData: {');
    // For the closing of setScheduleFormData, we need to add extra })
    // This is complex - let's handle it differently

    // setRecordFormData with object
    c = c.replace(/setRecordFormData\(\{(\s*\w+:)/g, 'this.setState({ recordFormData: {$1');

    // navigate -> this.props.navigate
    if (options.usesNavigate) {
        // Only prefix standalone navigate( calls - not part of this.props.navigate already
        c = c.replace(/(?<!\.)(?<!props\.)navigate\(/g, 'this.props.navigate(');
        c = c.replace(/this\.props\.this\.props\.navigate/g, 'this.props.navigate');
    }

    // Function calls that need this. prefix
    const methodNames = [
        'fetchAppointments', 'fetchDoctors', 'fetchSpecialties', 'fetchAvailableDoctorsForBooking',
        'fetchAvailableDoctorsForAssignment', 'fetchDoctorTimeSlots', 'fetchDoctorStatus',
        'fetchRecentBookings', 'fetchStats', 'fetchPatients', 'fetchAllSchedules',
        'fetchDoctorSchedule', 'fetchPatientHistory', 'fetchMedicalRecords', 'fetchRooms',
        'handleCreateAppointment', 'handleConfirm', 'handleCancel', 'handleAssignDoctor',
        'handleAssignDoctorNew', 'handleStatusChange', 'handleFormChange',
        'handleOpenModal', 'handleCloseModal', 'handleChange', 'handleFilterChange',
        'handleSubmit', 'handleDeleteConfirm', 'handleDelete', 'handleToggleStatus',
        'handleOpenDoctorModal', 'handleTabChange', 'handleOpenScheduleModal',
        'handleScheduleFormChange', 'handleSaveSchedule', 'handleDeleteSchedule',
        'handleToggleScheduleActive', 'handleViewDetail', 'handleEdit', 'handleUpdatePatient',
        'handleEditRecord', 'handleUpdateRecord', 'handleCreate', 'handleCreateRoom',
        'handleCreateSpecialty', 'handleUpdateSpecialty', 'handleUpdateRoom',
        'confirmDelete', 'getStatusLabel', 'getStatusClass', 'getStatusBadge',
        'getStatusOptions', 'getSpecialtyColor', 'getStatusBadge',
        'openAdd', 'openEdit', 'handleToggle',
        'renderStatusBadge', 'formatDate', 'formatTime', 'fetchStats'
    ];

    for (const name of methodNames) {
        // Match function call not already prefixed
        const regex = new RegExp(`(?<!this\\.)(?<!api\\.)(?<!\\.)\\b(${name})\\(`, 'g');
        c = c.replace(regex, `this.$1(`);
        // Don't prefix if it's a declaration
        c = c.replace(new RegExp(`^(    )this\\.(${name}) = `, 'gm'), `$1$2 = `);
        // Don't prefix if it's a property assignment in event handler  
        c = c.replace(new RegExp(`^(    )this\\.(${name}) \\{`, 'gm'), `$1$2 {`);
    }

    // Fix double prefix
    c = c.replace(/this\.this\./g, 'this.');

    return c;
}

// ========================
// FILE 3: AdminDoctorManagement.jsx
// ========================
function convertAdminDoctorManagement() {
    const path = 'c:/tclinic_nhom3/client/src/pages/admin/AdminDoctorManagement.jsx';
    let c = fs.readFileSync(path, 'utf8');

    // Replace imports and function declaration with class
    c = c.replace(
        "import { useState, useEffect } from 'react';\nimport api from '../../utils/api';\nimport styles from './AdminDoctorManagement.module.css';",
        "import React, { Component } from 'react';\nimport api from '../../utils/api';\nimport styles from './AdminDoctorManagement.module.css';"
    );

    const DAYS_LINE = "const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];";

    // Replace function declaration with class + constructor
    const funcStart = "export default function AdminDoctorManagement() {";
    const stateBlock = c.substring(c.indexOf(funcStart), c.indexOf("    useEffect(() => {\n        fetchDoctors();"));

    c = c.replace(stateBlock, `class AdminDoctorManagement extends Component {
    constructor(props) {
        super(props);
        this.state = {
            doctors: [],
            specialties: [],
            loading: false,
            showModal: false,
            showDeleteModal: false,
            showDoctorModal: false,
            showScheduleModal: false,
            selectedDoctor: null,
            selectedTab: null,
            formData: {
                email: '',
                password: '',
                full_name: '',
                phone: '',
                gender: 'male',
                specialty_id: '',
                experience: '',
                education: '',
                description: ''
            },
            filters: {
                search: '',
                specialty_id: '',
                status: 'all'
            },
            doctorSchedule: null,
            editingSchedule: null,
            scheduleFormData: {
                day_of_week: 'Thứ 2',
                start_time: '08:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00',
                is_active: true,
                room: ''
            }
        };
    }

`);

    // Replace useEffect blocks with lifecycle
    c = c.replace(
        "    useEffect(() => {\n        fetchDoctors();\n    }, [filters]);\n\n    useEffect(() => {\n        fetchSpecialties();\n    }, []);",
        "    componentDidMount() {\n        this.fetchDoctors();\n        this.fetchSpecialties();\n    }\n\n    componentDidUpdate(prevProps, prevState) {\n        if (prevState.filters !== this.state.filters) {\n            this.fetchDoctors();\n        }\n    }"
    );

    c = convertGeneric(c, { usesNavigate: false });

    // Fix setFormData full object assignments - these need the extra closing brace
    // Pattern: this.setState({ formData: { email: doctor.email, ...}); -> need })
    // Search for the pattern and fix closing
    c = c.replace(/this\.setState\(\{ formData: \{([^}]+)\}\);/g, 'this.setState({ formData: {$1} });');
    c = c.replace(/this\.setState\(\{ scheduleFormData: \{([^}]+)\}\);/g, 'this.setState({ scheduleFormData: {$1} });');

    // State variable refs in methods need this.state. prefix
    // selectedDoctor.id in methods
    c = c.replace(/selectedDoctor\.id/g, 'this.state.selectedDoctor.id');
    c = c.replace(/selectedDoctor\.full_name/g, 'this.state.selectedDoctor.full_name');
    c = c.replace(/selectedDoctor\.email/g, 'this.state.selectedDoctor.email');
    c = c.replace(/selectedDoctor\.phone/g, 'this.state.selectedDoctor.phone');
    c = c.replace(/selectedDoctor\.gender/g, 'this.state.selectedDoctor.gender');
    c = c.replace(/selectedDoctor\.specialty_id/g, 'this.state.selectedDoctor.specialty_id');
    c = c.replace(/selectedDoctor\.experience/g, 'this.state.selectedDoctor.experience');
    c = c.replace(/selectedDoctor\.education/g, 'this.state.selectedDoctor.education');
    c = c.replace(/selectedDoctor\.description/g, 'this.state.selectedDoctor.description');
    c = c.replace(/selectedDoctor\.specialty/g, 'this.state.selectedDoctor.specialty');
    // But NOT in JSX conditional rendering like {selectedDoctor && ... } 
    // Those should use destructured state in render

    // Schedule form change handler -- needs special handling for checkbox
    c = c.replace(
        /handleScheduleFormChange = \(e\) => \{\s*const \{ name, value, type, checked \} = e\.target;\s*setScheduleFormData\(prev => \(\{\s*\.\.\.prev,\s*\[name\]: type === 'checkbox' \? checked : value\s*\}\)\);/gs,
        "handleScheduleFormChange = (e) => {\n        const { name, value, type, checked } = e.target;\n        this.setState(prev => ({\n            scheduleFormData: {\n                ...prev.scheduleFormData,\n                [name]: type === 'checkbox' ? checked : value\n            }\n        }));"
    );

    // handleChange for formData
    c = c.replace(
        /handleChange = \(e\) => \{\s*const \{ name, value \} = e\.target;\s*this\.setState\(prev => \(\{ formData: \{ \.\.\.prev\.formData, \[name\]: value \} \}\)\);/gs,
        "handleChange = (e) => {\n        const { name, value } = e.target;\n        this.setState(prev => ({ formData: { ...prev.formData, [name]: value } }));"
    );

    // handleFilterChange for filters
    c = c.replace(
        /handleFilterChange = \(e\) => \{\s*const \{ name, value \} = e\.target;\s*this\.setState\(prev => \(\{ filters: \{ \.\.\.prev\.filters, \[name\]: value \} \}\)\);/gs,
        "handleFilterChange = (e) => {\n        const { name, value } = e.target;\n        this.setState(prev => ({ filters: { ...prev.filters, [name]: value } }));"
    );

    // Fix: formData refs in methods need this.state
    c = c.replace(/!formData\.email/g, '!this.state.formData.email');
    c = c.replace(/!formData\.full_name/g, '!this.state.formData.full_name');
    c = c.replace(/!formData\.phone/g, '!this.state.formData.phone');
    c = c.replace(/!selectedDoctor && !formData\.password/g, '!this.state.selectedDoctor && !this.state.formData.password');
    c = c.replace(/api\.put\(`\/api\/admin\/doctors\/\$\{selectedDoctor\.id\}`, formData\)/g,
        'api.put(`/api/admin/doctors/${this.state.selectedDoctor.id}`, this.state.formData)');
    c = c.replace(/api\.post\('\/api\/admin\/doctors', formData\)/g,
        "api.post('/api/admin/doctors', this.state.formData)");
    c = c.replace(/api\.delete\(`\/api\/admin\/doctors\/\$\{selectedDoctor\.id\}`\)/g,
        'api.delete(`/api/admin/doctors/${this.state.selectedDoctor.id}`)');

    // scheduleFormData in method bodies  
    c = c.replace(/api\.put\(`\/api\/admin\/doctor-schedules\/\$\{editingSchedule\.id\}`, scheduleFormData\)/g,
        'api.put(`/api/admin/doctor-schedules/${this.state.editingSchedule.id}`, this.state.scheduleFormData)');
    c = c.replace(/doctor_id: selectedDoctor\.id,\s*\.\.\.scheduleFormData/g,
        'doctor_id: this.state.selectedDoctor.id,\n                    ...this.state.scheduleFormData');

    // Add render() method
    c = c.replace(
        /\n    return \(\n        <div className=\{styles\.container\}>/,
        "\n    render() {\n    const { doctors, specialties, loading, showModal, showDeleteModal, showDoctorModal, showScheduleModal, selectedDoctor, selectedTab, formData, filters, doctorSchedule, editingSchedule, scheduleFormData } = this.state;\n\n    return (\n        <div className={styles.container}>",
    );

    // Close render + class + export
    c = c.replace(
        /\n\}\s*$/,
        "\n    }\n}\n\nexport default AdminDoctorManagement;\n"
    );

    // Fix double this.state refs
    c = c.replace(/this\.state\.this\.state\./g, 'this.state.');

    fs.writeFileSync(path, c, 'utf8');
    console.log('Converted: AdminDoctorManagement.jsx');
}

// ========================
// FILE 4: AdminDoctors.jsx
// ========================
function convertAdminDoctors() {
    const path = 'c:/tclinic_nhom3/client/src/pages/admin/AdminDoctors.jsx';
    let c = fs.readFileSync(path, 'utf8');

    c = c.replace(
        "import { useState, useEffect } from 'react';\nimport api from '../../utils/api';\nimport styles from './AdminDoctors.module.css';",
        "import React, { Component } from 'react';\nimport api from '../../utils/api';\nimport styles from './AdminDoctors.module.css';"
    );

    c = c.replace(
        /export default function AdminDoctors\(\) \{\s*const \[doctors, setDoctors\] = useState\(\[\]\);\s*const \[specialties, setSpecialties\] = useState\(\[\]\);\s*const \[loading, setLoading\] = useState\(false\);\s*const \[showModal, setShowModal\] = useState\(false\);\s*const \[showDeleteModal, setShowDeleteModal\] = useState\(false\);\s*const \[selectedDoctor, setSelectedDoctor\] = useState\(null\);\s*const \[formData, setFormData\] = useState\(\{[^}]+\}\);\s*const \[filters, setFilters\] = useState\(\{[^}]+\}\);\s*useEffect\(\(\) => \{\s*fetchDoctors\(\);\s*fetchSpecialties\(\);\s*\}, \[filters\]\);/gs,
        `class AdminDoctors extends Component {
    constructor(props) {
        super(props);
        this.state = {
            doctors: [],
            specialties: [],
            loading: false,
            showModal: false,
            showDeleteModal: false,
            selectedDoctor: null,
            formData: {
                email: '',
                password: '',
                full_name: '',
                phone: '',
                gender: 'male',
                specialty_id: '',
                experience: '',
                education: '',
                description: ''
            },
            filters: {
                search: '',
                specialty_id: '',
                status: 'all'
            }
        };
    }

    componentDidMount() {
        this.fetchDoctors();
        this.fetchSpecialties();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.filters !== this.state.filters) {
            this.fetchDoctors();
            this.fetchSpecialties();
        }
    }`
    );

    c = convertGeneric(c, { usesNavigate: false });

    // State refs in methods
    c = c.replace(/!formData\.email/g, '!this.state.formData.email');
    c = c.replace(/!formData\.full_name/g, '!this.state.formData.full_name');
    c = c.replace(/!formData\.phone/g, '!this.state.formData.phone');
    c = c.replace(/!selectedDoctor && !formData\.password/g, '!this.state.selectedDoctor && !this.state.formData.password');
    c = c.replace(/api\.put\(`\/api\/admin\/doctors\/\$\{selectedDoctor\.id\}`, formData\)/g,
        'api.put(`/api/admin/doctors/${this.state.selectedDoctor.id}`, this.state.formData)');
    c = c.replace(/api\.post\('\/api\/admin\/doctors', formData\)/g,
        "api.post('/api/admin/doctors', this.state.formData)");
    c = c.replace(/api\.delete\(`\/api\/admin\/doctors\/\$\{selectedDoctor\.id\}`\)/g,
        'api.delete(`/api/admin/doctors/${this.state.selectedDoctor.id}`)');
    c = c.replace(/`\$\{doctor\.is_active \?/g, '`${doctor.is_active ?');
    c = c.replace(/api\.put\(`\/api\/admin\/doctors\/\$\{doctor\.id\}\/toggle-status`\)/g,
        'api.put(`/api/admin/doctors/${doctor.id}/toggle-status`)');

    // selectedDoctor refs in methods
    c = c.replace(/selectedDoctor\.email/g, 'this.state.selectedDoctor.email');
    c = c.replace(/selectedDoctor\.full_name/g, 'this.state.selectedDoctor.full_name');
    c = c.replace(/selectedDoctor\.phone/g, 'this.state.selectedDoctor.phone');
    c = c.replace(/selectedDoctor\.gender/g, 'this.state.selectedDoctor.gender');
    c = c.replace(/selectedDoctor\.specialty_id/g, 'this.state.selectedDoctor.specialty_id');
    c = c.replace(/selectedDoctor\.experience/g, 'this.state.selectedDoctor.experience');
    c = c.replace(/selectedDoctor\.education/g, 'this.state.selectedDoctor.education');
    c = c.replace(/selectedDoctor\.description/g, 'this.state.selectedDoctor.description');
    c = c.replace(/selectedDoctor\.id/g, 'this.state.selectedDoctor.id');

    // Add render
    c = c.replace(
        /\n    return \(\n        <div className=\{styles\.container\}>/,
        "\n    render() {\n    const { doctors, specialties, loading, showModal, showDeleteModal, selectedDoctor, formData, filters } = this.state;\n\n    return (\n        <div className={styles.container}>",
    );

    c = c.replace(/\n\}\s*$/, "\n    }\n}\n\nexport default AdminDoctors;\n");
    c = c.replace(/this\.state\.this\.state\./g, 'this.state.');

    fs.writeFileSync(path, c, 'utf8');
    console.log('Converted: AdminDoctors.jsx');
}

// ========================  
// FILE 5: AdminDoctorSchedule.jsx
// ========================
function convertAdminDoctorSchedule() {
    const path = 'c:/tclinic_nhom3/client/src/pages/admin/AdminDoctorSchedule.jsx';
    let c = fs.readFileSync(path, 'utf8');

    c = c.replace(
        "import React, { useState, useEffect } from 'react';",
        "import React, { Component } from 'react';"
    );

    // Replace function + hooks + useEffect with class
    const funcStart = c.indexOf("export default function AdminDoctorSchedule()");
    const useEffEnd = c.indexOf("    const fetchDoctors = async");
    const hookSection = c.substring(funcStart, useEffEnd);

    c = c.replace(hookSection, `class AdminDoctorSchedule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            doctors: [],
            specialties: [],
            allSchedules: [],
            loading: false,
            searchDoctor: '',
            selectedSpecialty: 'all',
            showModal: false,
            editingId: null,
            formData: {
                doctor_id: '',
                day_of_week: 'Thứ 2',
                start_time: '08:00',
                end_time: '17:00',
                break_start: '12:00',
                break_end: '13:00',
                room: '',
                is_active: true
            }
        };
        this.dayOptions = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    }

    componentDidMount() {
        this.fetchDoctors();
        this.fetchSpecialties();
        this.fetchAllSchedules();
    }

`);

    c = convertGeneric(c, { usesNavigate: false });

    // getSchedule method
    c = c.replace(
        /getSchedule = \(doctorId, day\) =>\s*allSchedules\.find/g,
        'getSchedule = (doctorId, day) =>\n        this.state.allSchedules.find'
    );

    // filteredDoctors - this is a computed value, need to move to render
    // For now, fix the refs  
    c = c.replace(/filteredDoctors = doctors\.filter/g, 'filteredDoctors = this.state.doctors.filter');

    // Fix formData refs in submit
    c = c.replace(/api\.put\(`\/api\/admin\/doctor-schedules\/\$\{editingId\}`, formData\)/g,
        'api.put(`/api/admin/doctor-schedules/${this.state.editingId}`, this.state.formData)');
    c = c.replace(/api\.post\('\/api\/admin\/doctor-schedules', formData\)/g,
        "api.post('/api/admin/doctor-schedules', this.state.formData)");

    // Fix dayOptions ref
    c = c.replace(/const dayOptions = \[.*?\];/g, '');
    c = c.replace(/dayOptions\b/g, 'this.dayOptions');
    // Fix in JSX where it was already replaced

    // scheduleCount and specialtyCounts - computed, move to render

    // setFormData in openAdd and openEdit
    c = c.replace(/this\.setState\(\{ formData: \{\s*doctor_id: doctorId,/g, 'this.setState({ formData: {\n            doctor_id: doctorId,');
    c = c.replace(/this\.setState\(\{ formData: \{\s*doctor_id: parseInt\(e\.target\.value\)/g, 'this.setState({ formData: {\n            doctor_id: parseInt(e.target.value)');

    // setFormData spread in JSX handlers
    c = c.replace(/setFormData\(\{ \.\.\.formData, (\w+): ([^}]+)\}\)/g,
        'this.setState(prev => ({ formData: { ...prev.formData, $1: $2} }))');

    // Add render
    c = c.replace(
        /\n    const scheduleCount = \{\};/,
        "\n    render() {\n    const { doctors, specialties, allSchedules, loading, searchDoctor, selectedSpecialty, showModal, editingId, formData } = this.state;\n    const dayOptions = this.dayOptions;\n\n    const filteredDoctors = doctors.filter(doc => {\n        const matchesSearch =\n            doc.full_name.toLowerCase().includes(searchDoctor.toLowerCase()) ||\n            doc.specialty?.name?.toLowerCase().includes(searchDoctor.toLowerCase());\n        const matchesSpecialty =\n            selectedSpecialty === 'all' || doc.specialty_id === parseInt(selectedSpecialty);\n        return matchesSearch && matchesSpecialty;\n    });\n\n    const scheduleCount = {};"
    );

    // Remove the old filteredDoctors declaration  
    c = c.replace(
        /    filteredDoctors = this\.state\.doctors\.filter\(doc => \{[\s\S]*?return matchesSearch && matchesSpecialty;\s*\}\);/g,
        ''
    );

    c = c.replace(/\n\}\s*$/, "\n    }\n}\n\nexport default AdminDoctorSchedule;\n");
    c = c.replace(/this\.state\.this\.state\./g, 'this.state.');

    fs.writeFileSync(path, c, 'utf8');
    console.log('Converted: AdminDoctorSchedule.jsx');
}

// ========================
// FILE 6: AdminPatients.jsx
// ========================
function convertAdminPatients() {
    const path = 'c:/tclinic_nhom3/client/src/pages/admin/AdminPatients.jsx';
    let c = fs.readFileSync(path, 'utf8');

    c = c.replace(
        "import { useState, useEffect } from 'react';",
        "import React, { Component } from 'react';"
    );

    // Replace function + hooks + useEffect
    const funcStart = c.indexOf("export default function AdminPatients()");
    const firstFunc = c.indexOf("    // Lấy danh sách bệnh nhân");
    const hookSection = c.substring(funcStart, firstFunc);

    c = c.replace(hookSection, `class AdminPatients extends Component {
    constructor(props) {
        super(props);
        this.state = {
            patients: [],
            loading: true,
            searchTerm: '',
            filterStatus: 'all',
            showDetailModal: false,
            showEditModal: false,
            showDeleteModal: false,
            showMedicalRecordModal: false,
            showEditRecordModal: false,
            selectedPatient: null,
            patientHistory: [],
            medicalRecords: [],
            selectedRecord: null,
            activeTab: 'info',
            formData: {
                full_name: '',
                email: '',
                phone: '',
                gender: 'male',
                birthday: '',
                address: ''
            },
            recordFormData: {
                symptoms: '',
                diagnosis: '',
                conclusion: '',
                note: ''
            }
        };
    }

`);

    // useEffect
    c = c.replace(
        /    useEffect\(\(\) => \{\s*fetchPatients\(\);\s*\}, \[searchTerm, filterStatus\]\);/gs,
        "    componentDidMount() {\n        this.fetchPatients();\n    }\n\n    componentDidUpdate(prevProps, prevState) {\n        if (prevState.searchTerm !== this.state.searchTerm || prevState.filterStatus !== this.state.filterStatus) {\n            this.fetchPatients();\n        }\n    }"
    );

    c = convertGeneric(c, { usesNavigate: false });

    // State refs in methods
    c = c.replace(/selectedPatient\.id/g, 'this.state.selectedPatient.id');
    c = c.replace(/selectedPatient\.full_name/g, 'this.state.selectedPatient.full_name');
    c = c.replace(/selectedPatient\.is_active/g, 'this.state.selectedPatient.is_active');
    c = c.replace(/selectedRecord\.id/g, 'this.state.selectedRecord.id');

    c = c.replace(/api\.put\(`\/api\/admin\/patients\/\$\{this\.state\.selectedPatient\.id\}`, formData\)/g,
        'api.put(`/api/admin/patients/${this.state.selectedPatient.id}`, this.state.formData)');
    c = c.replace(/api\.put\(`\/api\/admin\/medical-records\/\$\{this\.state\.selectedRecord\.id\}`, recordFormData\)/g,
        'api.put(`/api/admin/medical-records/${this.state.selectedRecord.id}`, this.state.recordFormData)');
    c = c.replace(/api\.delete\(`\/api\/admin\/patients\/\$\{this\.state\.selectedPatient\.id\}`\)/g,
        'api.delete(`/api/admin/patients/${this.state.selectedPatient.id}`)');

    // searchTerm and filterStatus in fetchPatients
    c = c.replace(/if \(searchTerm\) params\.append/g, 'if (this.state.searchTerm) params.append');
    c = c.replace(/if \(filterStatus !== 'all'\)/g, "if (this.state.filterStatus !== 'all')");
    c = c.replace(/params\.append\('status', filterStatus\)/g, "params.append('status', this.state.filterStatus)");
    c = c.replace(/params\.append\('search', searchTerm\)/g, "params.append('search', this.state.searchTerm)");

    // setFormData with object
    c = c.replace(/this\.setState\(\{ formData: \{\s*full_name: patient\.full_name/g,
        'this.setState({ formData: {\n            full_name: patient.full_name');
    c = c.replace(/this\.setState\(\{ recordFormData: \{\s*symptoms: record\.symptoms/g,
        'this.setState({ recordFormData: {\n            symptoms: record.symptoms');

    // patient.is_active in toggle method
    c = c.replace(/`\$\{patient\.is_active \?/g, '`${patient.is_active ?');

    // Add render
    c = c.replace(
        /\n    if \(loading\) \{\n        return <div className=\{styles\.loading\}>/,
        "\n    render() {\n    const { patients, loading, searchTerm, filterStatus, showDetailModal, showEditModal, showDeleteModal, showEditRecordModal, selectedPatient, patientHistory, medicalRecords, selectedRecord, activeTab, formData, recordFormData } = this.state;\n\n    if (loading) {\n        return <div className={styles.loading}>"
    );

    c = c.replace(/\n\}\s*$/, "\n    }\n}\n\nexport default AdminPatients;\n");
    c = c.replace(/this\.state\.this\.state\./g, 'this.state.');

    fs.writeFileSync(path, c, 'utf8');
    console.log('Converted: AdminPatients.jsx');
}

// ========================
// FILE 7: AdminSpecialties.jsx
// ========================
function convertAdminSpecialties() {
    const path = 'c:/tclinic_nhom3/client/src/pages/admin/AdminSpecialties.jsx';
    let c = fs.readFileSync(path, 'utf8');

    c = c.replace(
        "import { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';",
        "import React, { Component } from 'react';\nimport withRouter from '../../utils/withRouter';"
    );

    // Replace function + hooks + useEffect
    const funcStart = c.indexOf("export default function AdminSpecialties()");
    const firstFunc = c.indexOf("    // Lấy danh sách chuyên khoa");
    const hookSection = c.substring(funcStart, firstFunc);

    c = c.replace(hookSection, `class AdminSpecialties extends Component {
    constructor(props) {
        super(props);
        this.state = {
            specialties: [],
            loading: true,
            searchTerm: '',
            showCreateModal: false,
            showEditModal: false,
            showDeleteModal: false,
            showDetailModal: false,
            selectedSpecialty: null,
            formData: {
                name: '',
                description: '',
                image: ''
            }
        };
    }

`);

    // useEffect
    c = c.replace(
        /    useEffect\(\(\) => \{\s*fetchSpecialties\(\);\s*\}, \[searchTerm\]\);/gs,
        "    componentDidMount() {\n        this.fetchSpecialties();\n    }\n\n    componentDidUpdate(prevProps, prevState) {\n        if (prevState.searchTerm !== this.state.searchTerm) {\n            this.fetchSpecialties();\n        }\n    }"
    );

    c = convertGeneric(c, { usesNavigate: true });

    // State refs in methods
    c = c.replace(/if \(searchTerm\) params\.append/g, 'if (this.state.searchTerm) params.append');
    c = c.replace(/params\.append\('search', searchTerm\)/g, "params.append('search', this.state.searchTerm)");
    c = c.replace(/selectedSpecialty\.id/g, 'this.state.selectedSpecialty.id');
    c = c.replace(/api\.put\(`\/api\/admin\/specialties\/\$\{this\.state\.selectedSpecialty\.id\}`, formData\)/g,
        'api.put(`/api/admin/specialties/${this.state.selectedSpecialty.id}`, this.state.formData)');
    c = c.replace(/api\.delete\(`\/api\/admin\/specialties\/\$\{this\.state\.selectedSpecialty\.id\}`\)/g,
        'api.delete(`/api/admin/specialties/${this.state.selectedSpecialty.id}`)');

    // setFormData with objects
    c = c.replace(/this\.setState\(\{ formData: \{\s*name: specialty\.name/g,
        'this.setState({ formData: {\n            name: specialty.name');
    c = c.replace(/this\.setState\(\{ formData: \{\s*name: '',/g,
        "this.setState({ formData: {\n            name: '',");

    // Add render
    c = c.replace(
        /\n    if \(loading\) \{\n        return <div className=\{styles\.loading\}>/,
        "\n    render() {\n    const { specialties, loading, searchTerm, showCreateModal, showEditModal, showDeleteModal, showDetailModal, selectedSpecialty, formData } = this.state;\n    const { navigate } = this.props;\n\n    if (loading) {\n        return <div className={styles.loading}>"
    );

    c = c.replace(/\n\}\s*$/, "\n    }\n}\n\nexport default withRouter(AdminSpecialties);\n");
    c = c.replace(/this\.state\.this\.state\./g, 'this.state.');

    fs.writeFileSync(path, c, 'utf8');
    console.log('Converted: AdminSpecialties.jsx');
}

// ========================
// FILE 8: AdminRooms.jsx
// ========================
function convertAdminRooms() {
    const path = 'c:/tclinic_nhom3/client/src/pages/admin/AdminRooms.jsx';
    let c = fs.readFileSync(path, 'utf8');

    c = c.replace(
        "import { useState, useEffect } from 'react';\nimport { useNavigate, useLocation, Link } from 'react-router-dom';",
        "import React, { Component } from 'react';\nimport { Link } from 'react-router-dom';\nimport withRouter from '../../utils/withRouter';"
    );

    // Replace function + hooks
    const funcStart = c.indexOf("export default function AdminRooms()");
    const firstFunc = c.indexOf("    // Lấy danh sách phòng khám\n    const fetchRooms");
    if (firstFunc === -1) {
        console.error('Could not find fetchRooms in AdminRooms');
        return;
    }
    const hookSection = c.substring(funcStart, firstFunc);

    c = c.replace(hookSection, `class AdminRooms extends Component {
    constructor(props) {
        super(props);
        const initialSpecialtyFilter = new URLSearchParams(props.location.search).get('specialty_id') || '';
        this.state = {
            rooms: [],
            specialties: [],
            loading: true,
            searchTerm: '',
            filterFloor: '',
            filterSpecialty: initialSpecialtyFilter,
            filterStatus: '',
            viewMode: 'floor',
            stats: null,
            showCreateModal: false,
            showEditModal: false,
            showDeleteModal: false,
            selectedRoom: null,
            formData: {
                name: '',
                room_number: '',
                floor: 1,
                specialty_id: '',
                location: '',
                status: 'active',
                capacity: 1,
                description: ''
            }
        };
    }

`);

    // useEffect  
    c = c.replace(
        /    useEffect\(\(\) => \{\s*fetchRooms\(\);\s*fetchSpecialties\(\);\s*fetchStats\(\);\s*\}, \[searchTerm, filterFloor, filterSpecialty, filterStatus\]\);/gs,
        "    componentDidMount() {\n        this.fetchRooms();\n        this.fetchSpecialties();\n        this.fetchStats();\n    }\n\n    componentDidUpdate(prevProps, prevState) {\n        if (prevState.searchTerm !== this.state.searchTerm || prevState.filterFloor !== this.state.filterFloor || prevState.filterSpecialty !== this.state.filterSpecialty || prevState.filterStatus !== this.state.filterStatus) {\n            this.fetchRooms();\n            this.fetchSpecialties();\n            this.fetchStats();\n        }\n    }"
    );

    c = convertGeneric(c, { usesNavigate: true });

    // State refs in methods
    c = c.replace(/if \(searchTerm\) params\.append/g, 'if (this.state.searchTerm) params.append');
    c = c.replace(/if \(filterFloor\) params\.append/g, 'if (this.state.filterFloor) params.append');
    c = c.replace(/if \(filterSpecialty\) params\.append/g, 'if (this.state.filterSpecialty) params.append');
    c = c.replace(/if \(filterStatus\) params\.append/g, 'if (this.state.filterStatus) params.append');
    c = c.replace(/params\.append\('search', searchTerm\)/g, "params.append('search', this.state.searchTerm)");
    c = c.replace(/params\.append\('floor', filterFloor\)/g, "params.append('floor', this.state.filterFloor)");
    c = c.replace(/params\.append\('specialty_id', filterSpecialty\)/g, "params.append('specialty_id', this.state.filterSpecialty)");
    c = c.replace(/params\.append\('status', filterStatus\)/g, "params.append('status', this.state.filterStatus)");

    c = c.replace(/selectedRoom\.id/g, 'this.state.selectedRoom.id');
    c = c.replace(/api\.put\(`\/api\/admin\/rooms\/\$\{this\.state\.selectedRoom\.id\}`, formData\)/g,
        'api.put(`/api/admin/rooms/${this.state.selectedRoom.id}`, this.state.formData)');
    c = c.replace(/api\.delete\(`\/api\/admin\/rooms\/\$\{this\.state\.selectedRoom\.id\}`\)/g,
        'api.delete(`/api/admin/rooms/${this.state.selectedRoom.id}`)');
    c = c.replace(/api\.post\('\/api\/admin\/rooms', formData\)/g,
        "api.post('/api/admin/rooms', this.state.formData)");

    // roomsByFloor computed - move to render

    // Add render
    c = c.replace(
        /\n    if \(loading && rooms\.length === 0\) \{/,
        "\n    render() {\n    const { rooms, specialties, loading, searchTerm, filterFloor, filterSpecialty, filterStatus, viewMode, stats, showCreateModal, showEditModal, showDeleteModal, selectedRoom, formData } = this.state;\n    const { navigate } = this.props;\n\n    // Nhóm phòng theo tầng\n    const roomsByFloor = rooms.reduce((acc, room) => {\n        const floor = room.floor || 0;\n        if (!acc[floor]) acc[floor] = [];\n        acc[floor].push(room);\n        return acc;\n    }, {});\n\n    if (loading && rooms.length === 0) {"
    );

    // Remove old roomsByFloor declaration
    c = c.replace(
        /    \/\/ Nhóm phòng theo tầng\s*\n    const roomsByFloor = rooms\.reduce[\s\S]*?\}, \{\}\);/g,
        ''
    );
    // But keep it in render

    c = c.replace(/\n\}\s*$/, "\n    }\n}\n\nexport default withRouter(AdminRooms);\n");
    c = c.replace(/this\.state\.this\.state\./g, 'this.state.');

    fs.writeFileSync(path, c, 'utf8');
    console.log('Converted: AdminRooms.jsx');
}

// Run all conversions
try { convertAdminDoctorManagement(); } catch (e) { console.error('Error in AdminDoctorManagement:', e.message); }
try { convertAdminDoctors(); } catch (e) { console.error('Error in AdminDoctors:', e.message); }
try { convertAdminDoctorSchedule(); } catch (e) { console.error('Error in AdminDoctorSchedule:', e.message); }
try { convertAdminPatients(); } catch (e) { console.error('Error in AdminPatients:', e.message); }
try { convertAdminSpecialties(); } catch (e) { console.error('Error in AdminSpecialties:', e.message); }
try { convertAdminRooms(); } catch (e) { console.error('Error in AdminRooms:', e.message); }
