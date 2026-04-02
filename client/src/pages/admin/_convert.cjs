const fs = require('fs');

function convertFile(filePath, options) {
    let c = fs.readFileSync(filePath, 'utf8');

    // Remove const from all function declarations inside the component
    c = c.replace(/^(    )const (\w+) = (async )?\(/gm, '$1$2 = $3(');
    c = c.replace(/^(    )const (\w+) = async \(/gm, '$1$2 = async (');

    // Simple boolean/null/empty setters: setXxx(value) -> this.setState({ xxx: value })
    const simpleSetters = [
        'loading', 'loadingDoctors', 'showConfirmModal', 'showCancelModal',
        'showAssignModal', 'showAssignNewModal', 'showCreateModal', 'showDeleteModal',
        'showModal', 'showDoctorModal', 'showScheduleModal', 'showEditModal',
        'showDetailModal', 'showMedicalRecordModal', 'showEditRecordModal',
        'noAvailableDoctor'
    ];

    for (const name of simpleSetters) {
        const setter = 'set' + name.charAt(0).toUpperCase() + name.slice(1);
        c = c.replace(new RegExp(setter.replace(/([()])/g, '\\$1') + '\\(true\\)', 'g'), `this.setState({ ${name}: true })`);
        c = c.replace(new RegExp(setter.replace(/([()])/g, '\\$1') + '\\(false\\)', 'g'), `this.setState({ ${name}: false })`);
        c = c.replace(new RegExp(setter.replace(/([()])/g, '\\$1') + '\\(null\\)', 'g'), `this.setState({ ${name}: null })`);
    }

    // Empty string setters
    const stringSetters = ['selectedDoctor', 'selectedTimeSlot', 'cancelReason', 'searchTerm',
        'searchDoctor', 'selectedSpecialty', 'filterStatus', 'filterFloor', 'filterSpecialty'];
    for (const name of stringSetters) {
        const setter = 'set' + name.charAt(0).toUpperCase() + name.slice(1);
        c = c.replace(new RegExp(setter + "\\('(.*?)'\\)", 'g'), `this.setState({ ${name}: '$1' })`);
        c = c.replace(new RegExp(setter + '\\("(.*?)"\\)', 'g'), `this.setState({ ${name}: "$1" })`);
    }

    // Array/object reset setters
    c = c.replace(/setAvailableDoctors\(\[\]\)/g, 'this.setState({ availableDoctors: [] })');
    c = c.replace(/setAvailableDoctorsForAssignment\(\[\]\)/g, 'this.setState({ availableDoctorsForAssignment: [] })');
    c = c.replace(/setDoctorTimeSlots\(null\)/g, 'this.setState({ doctorTimeSlots: null })');
    c = c.replace(/setDoctorSchedule\(null\)/g, 'this.setState({ doctorSchedule: null })');
    c = c.replace(/setDoctorSchedule\(\[\]\)/g, 'this.setState({ doctorSchedule: [] })');
    c = c.replace(/setSelectedDoctor\(null\)/g, 'this.setState({ selectedDoctor: null })');
    c = c.replace(/setSelectedPatient\(null\)/g, 'this.setState({ selectedPatient: null })');
    c = c.replace(/setSelectedSpecialty\(null\)/g, 'this.setState({ selectedSpecialty: null })');
    c = c.replace(/setSelectedRoom\(null\)/g, 'this.setState({ selectedRoom: null })');
    c = c.replace(/setSelectedRecord\(null\)/g, 'this.setState({ selectedRecord: null })');
    c = c.replace(/setEditingSchedule\(null\)/g, 'this.setState({ editingSchedule: null })');
    c = c.replace(/setEditingId\(null\)/g, 'this.setState({ editingId: null })');
    c = c.replace(/setStats\(null\)/g, 'this.setState({ stats: null })');

    // Setters with response data
    c = c.replace(/setAppointments\(response\.data\.bookings \|\| \[\]\)/g, 'this.setState({ appointments: response.data.bookings || [] })');
    c = c.replace(/setDoctors\(response\.data \|\| \[\]\)/g, 'this.setState({ doctors: response.data || [] })');
    c = c.replace(/setDoctors\(response\.data\)/g, 'this.setState({ doctors: response.data })');
    c = c.replace(/setSpecialties\(response\.data \|\| \[\]\)/g, 'this.setState({ specialties: response.data || [] })');
    c = c.replace(/setSpecialties\(response\.data\)/g, 'this.setState({ specialties: response.data })');
    c = c.replace(/setAvailableDoctors\(response\.data\.doctors \|\| \[\]\)/g, 'this.setState({ availableDoctors: response.data.doctors || [] })');
    c = c.replace(/setAvailableDoctorsForAssignment\(response\.data\.availableDoctors \|\| \[\]\)/g, 'this.setState({ availableDoctorsForAssignment: response.data.availableDoctors || [] })');
    c = c.replace(/setNoAvailableDoctor\(response\.data\.noAvailableDoctor \|\| false\)/g, 'this.setState({ noAvailableDoctor: response.data.noAvailableDoctor || false })');
    c = c.replace(/setBookingDayOfWeek\(response\.data\.booking\?\.dayOfWeek \|\| ''\)/g, "this.setState({ bookingDayOfWeek: response.data.booking?.dayOfWeek || '' })");
    c = c.replace(/setDoctorTimeSlots\(response\.data\.data\)/g, 'this.setState({ doctorTimeSlots: response.data.data })');
    c = c.replace(/setDoctorStatus\(response\.data\)/g, 'this.setState({ doctorStatus: response.data })');
    c = c.replace(/setStats\(response\.data\)/g, 'this.setState({ stats: response.data })');
    c = c.replace(/setRooms\(response\.data\)/g, 'this.setState({ rooms: response.data })');
    c = c.replace(/setAllSchedules\(response\.data\)/g, 'this.setState({ allSchedules: response.data })');
    c = c.replace(/setPatients\(response\.data\)/g, 'this.setState({ patients: response.data })');
    c = c.replace(/setDoctorSchedule\(response\.data\)/g, 'this.setState({ doctorSchedule: response.data })');

    // Setters with variable arguments
    c = c.replace(/setSelectedDoctor\((\w+)\)/g, 'this.setState({ selectedDoctor: $1 })');
    c = c.replace(/setSelectedAppointment\((\w+)\)/g, 'this.setState({ selectedAppointment: $1 })');
    c = c.replace(/setSelectedPatient\((\w+)\)/g, 'this.setState({ selectedPatient: $1 })');
    c = c.replace(/setSelectedSpecialty\((\w+)\)/g, 'this.setState({ selectedSpecialty: $1 })');
    c = c.replace(/setSelectedRoom\((\w+)\)/g, 'this.setState({ selectedRoom: $1 })');
    c = c.replace(/setSelectedRecord\((\w+)\)/g, 'this.setState({ selectedRecord: $1 })');
    c = c.replace(/setSelectedTab\((\w+)\)/g, 'this.setState({ selectedTab: $1 })');
    c = c.replace(/setActiveTab\((\w+)\)/g, 'this.setState({ activeTab: $1 })');
    c = c.replace(/setEditingSchedule\((\w+)\)/g, 'this.setState({ editingSchedule: $1 })');
    c = c.replace(/setEditingId\((\w+)\)/g, 'this.setState({ editingId: $1 })');
    c = c.replace(/setViewMode\((\w+)\)/g, 'this.setState({ viewMode: $1 })');

    // String argument setters (with quotes)
    c = c.replace(/setSelectedDoctor\(String\(doc\.id\)\)/g, 'this.setState({ selectedDoctor: String(doc.id) })');
    c = c.replace(/setSelectedTab\('(\w+)'\)/g, "this.setState({ selectedTab: '$1' })");
    c = c.replace(/setActiveTab\('(\w+)'\)/g, "this.setState({ activeTab: '$1' })");
    c = c.replace(/setViewMode\('(\w+)'\)/g, "this.setState({ viewMode: '$1' })");
    c = c.replace(/setSelectedSpecialty\('(\w+)'\)/g, "this.setState({ selectedSpecialty: '$1' })");
    c = c.replace(/setSelectedSpecialty\(String\(([^)]+)\)\)/g, 'this.setState({ selectedSpecialty: String($1) })');

    // Setter with callback and spread: setXxx(prev => ({...prev, key: val}))
    c = c.replace(/setCancelReason\(([^)]+)\)/g, 'this.setState({ cancelReason: $1 })');

    // Complex setters - setPagination with callback
    c = c.replace(
        /setPagination\(prev => \(\{\s*\.\.\.prev,\s*page: response\.data\.page \|\| 1,\s*totalPages: response\.data\.totalPages \|\| 1,\s*total: response\.data\.total \|\| 0\s*\}\)\)/g,
        'this.setState(prev => ({ pagination: { ...prev.pagination, page: response.data.page || 1, totalPages: response.data.totalPages || 1, total: response.data.total || 0 } }))'
    );

    // setFormData with spread: setFormData(prev => ({...prev, [field]: value}))
    c = c.replace(/setFormData\(prev => \(\{ \.\.\.prev, \[field\]: value \}\)\)/g,
        'this.setState(prev => ({ formData: { ...prev.formData, [field]: value } }))');
    c = c.replace(/setFormData\(prev => \(\{ \.\.\.prev, \[field\]: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\] \}\)\)/g,
        "this.setState(prev => ({ formData: { ...prev.formData, [field]: new Date().toISOString().split('T')[0] } }))");

    // setFormData with object literal (inline in JSX): setFormData({ ...formData, key: value })
    // This pattern is used in JSX onChange handlers
    c = c.replace(/setFormData\(\{ \.\.\.formData, (\w+): ([^}]+)\}\)/g,
        'this.setState(prev => ({ formData: { ...prev.formData, $1: $2} }))');

    // setRecordFormData
    c = c.replace(/setRecordFormData\(\{ \.\.\.recordFormData, (\w+): ([^}]+)\}\)/g,
        'this.setState(prev => ({ recordFormData: { ...prev.recordFormData, $1: $2} }))');

    // setFilter with spread
    c = c.replace(/setFilter\(\{ \.\.\.filter, (\w+): ([^}]+)\}\)/g,
        'this.setState(prev => ({ filter: { ...prev.filter, $1: $2} }))');
    // setFilter with full object (reset)  
    c = c.replace(/setFilter\(\{ status: '', date: ([^,]+), doctor_id: '' \}\)/g,
        "this.setState({ filter: { status: '', date: $1, doctor_id: '' } })");
    c = c.replace(/setFilter\(\{ status: '', date: '', doctor_id: '' \}\)/g,
        "this.setState({ filter: { status: '', date: '', doctor_id: '' } })");

    // setFilters with spread
    c = c.replace(/setFilters\(prev => \(\{ \.\.\.prev, \[name\]: value \}\)\)/g,
        'this.setState(prev => ({ filters: { ...prev.filters, [name]: value } }))');

    // setFormData with full object reset in handleCreateAppointment
    c = c.replace(
        /setFormData\(\{\s*patient_name: '',\s*patient_email: '',\s*patient_phone: '',\s*patient_gender: 'male',\s*patient_dob: '',\s*patient_address: '',\s*specialty_id: '',\s*doctor_id: '',\s*appointment_date: '',\s*appointment_time: '',\s*symptoms: '',\s*note: ''\s*\}\)/g,
        "this.setState({ formData: { patient_name: '', patient_email: '', patient_phone: '', patient_gender: 'male', patient_dob: '', patient_address: '', specialty_id: '', doctor_id: '', appointment_date: '', appointment_time: '', symptoms: '', note: '' } })"
    );

    // setFormData with object (for edit modals): setFormData({key: val, ...})
    // These are usually multi-line, handle them specifically for each file

    // navigate -> this.props.navigate (only in files that use withRouter)
    if (options.usesNavigate) {
        // Don't replace inside this.props.navigate (already converted) or this.setState
        c = c.replace(/([^.])navigate\(/g, (match, prefix) => {
            if (prefix === "'") return match; // part of a string
            return prefix + 'this.props.navigate(';
        });
        // Fix double conversion
        c = c.replace(/this\.props\.this\.props\.navigate/g, 'this.props.navigate');
    }

    // Function calls that need this. prefix (fetchXxx, handleXxx)
    // Only in method bodies and JSX event handlers
    const methodNames = [
        'fetchAppointments', 'fetchDoctors', 'fetchSpecialties', 'fetchAvailableDoctorsForBooking',
        'fetchAvailableDoctorsForAssignment', 'fetchDoctorTimeSlots', 'fetchDoctorStatus',
        'fetchRecentBookings', 'fetchStats', 'fetchPatients', 'fetchAllSchedules',
        'fetchDoctorSchedule', 'fetchPatientHistory', 'fetchMedicalRecords', 'fetchRooms',
        'fetchSpecialties', 'fetchStats',
        'handleCreateAppointment', 'handleConfirm', 'handleCancel', 'handleAssignDoctor',
        'handleAssignDoctorNew', 'handleStatusChange', 'handleFormChange',
        'handleOpenModal', 'handleCloseModal', 'handleChange', 'handleFilterChange',
        'handleSubmit', 'handleDeleteConfirm', 'handleDelete', 'handleToggleStatus',
        'handleOpenDoctorModal', 'handleTabChange', 'handleOpenScheduleModal',
        'handleScheduleFormChange', 'handleSaveSchedule', 'handleDeleteSchedule',
        'handleToggleScheduleActive', 'handleViewDetail', 'handleEdit', 'handleUpdatePatient',
        'handleEditRecord', 'handleUpdateRecord', 'handleToggleStatus', 'handleCreate',
        'handleCreateRoom', 'handleCreateSpecialty', 'handleUpdateSpecialty', 'handleUpdateRoom',
        'confirmDelete', 'handleUpdateRecord',
        'getStatusLabel', 'getStatusClass', 'getStatusBadge', 'getStatusOptions',
        'getStatusBadge', 'getSpecialtyColor', 'openAdd', 'openEdit', 'handleToggle',
        'renderStatusBadge', 'formatDate', 'formatTime'
    ];

    for (const name of methodNames) {
        // In JSX event handlers: onClick={() => fetchXxx()} 
        // But NOT when already prefixed with this. or api.
        const regex = new RegExp(`(?<!this\\.)(?<!api\\.)(?<!\\.)(${name})\\(`, 'g');
        c = c.replace(regex, `this.$1(`);
        // Fix: don't prefix if it's a function declaration (at start of line with spaces)
        c = c.replace(new RegExp(`^(    )this\\.(${name}) = `, 'gm'), `$1$2 = `);
    }

    // Fix this.this. double prefix
    c = c.replace(/this\.this\./g, 'this.');

    return c;
}

// State variable references in method bodies need this.state. prefix
// We handle this by finding method bodies and adding destructuring
function addStateDestructuring(content, methodName, stateVars) {
    // This is complex, skip for now - handle in render() destructuring
    return content;
}

function addRenderMethod(content) {
    // Find the pattern: isolated if (loading) or return ( that starts the render section
    // Add render() { with state destructuring before it
    return content;
}

// Process each file
const files = [
    {
        path: 'c:/tclinic_nhom3/client/src/pages/admin/Appointments.jsx',
        usesNavigate: true,
        usesLocation: false
    }
];

for (const file of files) {
    try {
        let content = convertFile(file.path, file);

        // File-specific state references in method bodies
        // For Appointments.jsx: formData, selectedAppointment, selectedDoctor, etc. in method bodies
        // We need to add this.state. prefix for state reads in methods

        // In fetchAppointments: filter.status, filter.date, filter.doctor_id, pagination.limit
        content = content.replace(
            '    fetchAppointments = async (page = 1) => {\n        try {',
            '    fetchAppointments = async (page = 1) => {\n        const { filter, pagination } = this.state;\n        try {'
        );

        // In handleCreateAppointment: formData reference
        content = content.replace(
            "await api.post('/api/admin/bookings', formData)",
            "await api.post('/api/admin/bookings', this.state.formData)"
        );

        // In handleConfirm: selectedDoctor, selectedAppointment  
        content = content.replace(
            '    handleConfirm = async () => {\n        try {',
            '    handleConfirm = async () => {\n        const { selectedDoctor, selectedAppointment } = this.state;\n        try {'
        );

        // In handleCancel: selectedAppointment, cancelReason
        content = content.replace(
            '    handleCancel = async () => {\n        try {',
            '    handleCancel = async () => {\n        const { selectedAppointment, cancelReason } = this.state;\n        try {'
        );

        // In handleAssignDoctor: selectedDoctor, selectedAppointment
        content = content.replace(
            '    handleAssignDoctor = async () => {\n        try {',
            '    handleAssignDoctor = async () => {\n        const { selectedDoctor, selectedAppointment } = this.state;\n        try {'
        );

        // In handleAssignDoctorNew: selectedDoctor, selectedAppointment, selectedTimeSlot
        content = content.replace(
            '    handleAssignDoctorNew = async () => {',
            '    handleAssignDoctorNew = async () => {\n        const { selectedDoctor, selectedAppointment, selectedTimeSlot } = this.state;'
        );

        // Fix state refs that are now destructured
        content = content.replace(/this\.state\.selectedDoctor(?!s)/g, (match, offset) => {
            // Check if inside a destructured method (rough heuristic)
            return 'selectedDoctor';
        });
        // Actually this is getting complicated. Let me just leave the this.state. prefix where needed
        // and remove the destructuring approach for method bodies. It's cleaner.

        // Remove the destructuring we just added - simpler to use this.state. everywhere in methods
        content = content.replace(
            '    fetchAppointments = async (page = 1) => {\n        const { filter, pagination } = this.state;\n        try {',
            '    fetchAppointments = async (page = 1) => {\n        try {'
        );
        content = content.replace(
            '    handleConfirm = async () => {\n        const { selectedDoctor, selectedAppointment } = this.state;\n        try {',
            '    handleConfirm = async () => {\n        try {'
        );
        content = content.replace(
            '    handleCancel = async () => {\n        const { selectedAppointment, cancelReason } = this.state;\n        try {',
            '    handleCancel = async () => {\n        try {'
        );
        content = content.replace(
            '    handleAssignDoctor = async () => {\n        const { selectedDoctor, selectedAppointment } = this.state;\n        try {',
            '    handleAssignDoctor = async () => {\n        try {'
        );
        content = content.replace(
            '    handleAssignDoctorNew = async () => {\n        const { selectedDoctor, selectedAppointment, selectedTimeSlot } = this.state;',
            '    handleAssignDoctorNew = async () => {'
        );

        // Instead, prefix bare state variable references in method bodies with this.state.
        // These are references that look like: filter.status, pagination.limit, formData, selectedAppointment.id, etc.
        // In methods (not in render/JSX), state vars need this.state.

        // The tricky part: in the JSX/render section, we'll destructure them.
        // But in method bodies above render(), we need this.state. prefix.

        // For fetchAppointments: filter.xx and pagination.xx
        // These are the only bare state refs in this method since setters are already converted
        const fetchAppBlock = content.match(/fetchAppointments = async[\s\S]*?(?=\n    \w+ = )/);
        if (fetchAppBlock) {
            let block = fetchAppBlock[0];
            block = block.replace(/(?<!\.)(?<!this\.state\.)(?<!this\.)(filter\.)/g, 'this.state.filter.');
            block = block.replace(/(?<!\.)(?<!this\.state\.)(?<!this\.)(pagination\.limit)/g, 'this.state.pagination.limit');
            content = content.replace(fetchAppBlock[0], block);
        }

        // selectedAppointment.id in method bodies
        content = content.replace(/\$\{selectedAppointment\.id\}/g, '${this.state.selectedAppointment.id}');

        // cancelReason in method bodies
        content = content.replace(/cancel_reason: cancelReason/g, 'cancel_reason: this.state.cancelReason');

        // selectedDoctor in method bodies (not this.setState calls)
        content = content.replace(/updateData\.doctor_id = selectedDoctor;/g, 'updateData.doctor_id = this.state.selectedDoctor;');
        content = content.replace(/if \(selectedDoctor\) \{/g, 'if (this.state.selectedDoctor) {');
        content = content.replace(/doctor_id: selectedDoctor,/g, 'doctor_id: this.state.selectedDoctor,');
        content = content.replace(/doctor_id: selectedDoctor\n/g, 'doctor_id: this.state.selectedDoctor\n');
        content = content.replace(/if \(!selectedDoctor\) \{/g, 'if (!this.state.selectedDoctor) {');

        // selectedAppointment.appointment_time in handleAssignDoctorNew
        content = content.replace(
            /const timeToUse = selectedAppointment\.appointment_time \|\| selectedTimeSlot;/g,
            'const timeToUse = this.state.selectedAppointment.appointment_time || this.state.selectedTimeSlot;'
        );

        // Add render() method wrapper
        // Find the standalone return that starts the JSX
        content = content.replace(
            /(\n    if \(loading\) \{\n        return <div)/,
            '\n    render() {\n    const { appointments, doctors, availableDoctors, specialties, loading, filter, selectedAppointment, showConfirmModal, showCancelModal, showAssignModal, showAssignNewModal, showCreateModal, selectedDoctor, availableDoctorsForAssignment, noAvailableDoctor, bookingDayOfWeek, doctorTimeSlots, selectedTimeSlot, cancelReason, loadingDoctors, pagination, formData } = this.state;\n    const { navigate } = this.props;\n\n    if (loading) {\n        return <div'
        );

        // Close the render method and class, add export
        content = content.replace(/\n\}\s*$/, '\n    }\n}\n\nexport default withRouter(Appointments);\n');

        // Fix any remaining this.state.this.state double prefix
        content = content.replace(/this\.state\.this\.state\./g, 'this.state.');

        fs.writeFileSync(file.path, content, 'utf8');
        console.log('Converted: ' + file.path);
    } catch (err) {
        console.error('Error converting ' + file.path + ': ' + err.message);
    }
}
