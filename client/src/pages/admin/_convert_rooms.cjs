const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'AdminRooms.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Fix imports
code = code.replace(
    "import { useState, useEffect } from 'react';",
    "import { Component } from 'react';"
);
code = code.replace(
    "import { useNavigate, useLocation, Link } from 'react-router-dom';",
    "import { Link } from 'react-router-dom';\nimport withRouter from '../../utils/withRouter';"
);

// 2. Replace function declaration with class + constructor
code = code.replace(
    "export default function AdminRooms() {\n" +
    "    const location = useLocation();\n" +
    "    const navigate = useNavigate();\n" +
    "    const [rooms, setRooms] = useState([]);\n" +
    "    const [specialties, setSpecialties] = useState([]);\n" +
    "    const [loading, setLoading] = useState(true);\n" +
    "    const [searchTerm, setSearchTerm] = useState('');\n" +
    "    const [filterFloor, setFilterFloor] = useState('');\n" +
    "    // Pre-fill specialty filter from URL param (?specialty_id=X)\n" +
    "    const [filterSpecialty, setFilterSpecialty] = useState(\n" +
    "        () => new URLSearchParams(location.search).get('specialty_id') || ''\n" +
    "    );\n" +
    "    const [filterStatus, setFilterStatus] = useState('');\n" +
    "    const [viewMode, setViewMode] = useState('floor'); // 'floor' | 'list'\n" +
    "    const [stats, setStats] = useState(null);\n" +
    "\n" +
    "    // Modals\n" +
    "    const [showCreateModal, setShowCreateModal] = useState(false);\n" +
    "    const [showEditModal, setShowEditModal] = useState(false);\n" +
    "    const [showDeleteModal, setShowDeleteModal] = useState(false);\n" +
    "    const [selectedRoom, setSelectedRoom] = useState(null);\n" +
    "\n" +
    "    // Form data\n" +
    "    const [formData, setFormData] = useState({\n" +
    "        name: '',\n" +
    "        room_number: '',\n" +
    "        floor: 1,\n" +
    "        specialty_id: '',\n" +
    "        location: '',\n" +
    "        status: 'active',\n" +
    "        capacity: 1,\n" +
    "        description: ''\n" +
    "    });",
    "class AdminRooms extends Component {\n" +
    "    constructor(props) {\n" +
    "        super(props);\n" +
    "        this.state = {\n" +
    "            rooms: [],\n" +
    "            specialties: [],\n" +
    "            loading: true,\n" +
    "            searchTerm: '',\n" +
    "            filterFloor: '',\n" +
    "            // Pre-fill specialty filter from URL param (?specialty_id=X)\n" +
    "            filterSpecialty: new URLSearchParams(props.location.search).get('specialty_id') || '',\n" +
    "            filterStatus: '',\n" +
    "            viewMode: 'floor', // 'floor' | 'list'\n" +
    "            stats: null,\n" +
    "            // Modals\n" +
    "            showCreateModal: false,\n" +
    "            showEditModal: false,\n" +
    "            showDeleteModal: false,\n" +
    "            selectedRoom: null,\n" +
    "            // Form data\n" +
    "            formData: {\n" +
    "                name: '',\n" +
    "                room_number: '',\n" +
    "                floor: 1,\n" +
    "                specialty_id: '',\n" +
    "                location: '',\n" +
    "                status: 'active',\n" +
    "                capacity: 1,\n" +
    "                description: ''\n" +
    "            }\n" +
    "        };\n" +
    "    }"
);

// 3. Replace useEffect with componentDidMount + componentDidUpdate
code = code.replace(
    "    useEffect(() => {\n" +
    "        fetchRooms();\n" +
    "        fetchSpecialties();\n" +
    "        fetchStats();\n" +
    "    }, [searchTerm, filterFloor, filterSpecialty, filterStatus]);",
    "    componentDidMount() {\n" +
    "        this.fetchRooms();\n" +
    "        this.fetchSpecialties();\n" +
    "        this.fetchStats();\n" +
    "    }\n" +
    "\n" +
    "    componentDidUpdate(prevProps, prevState) {\n" +
    "        if (prevState.searchTerm !== this.state.searchTerm ||\n" +
    "            prevState.filterFloor !== this.state.filterFloor ||\n" +
    "            prevState.filterSpecialty !== this.state.filterSpecialty ||\n" +
    "            prevState.filterStatus !== this.state.filterStatus) {\n" +
    "            this.fetchRooms();\n" +
    "            this.fetchSpecialties();\n" +
    "            this.fetchStats();\n" +
    "        }\n" +
    "    }"
);

// 4. Convert all "const funcName = async" and "const funcName = " to class arrow methods
code = code.replace(/    const (\w+) = async \(/g, '    $1 = async (');
code = code.replace(/    const (\w+) = \(([^)]*)\) => \{/g, '    $1 = ($2) => {');

// 5. Replace all simple setState calls: setXxx(value) -> this.setState({ xxx: value })
const simpleSetters = [
    'setRooms', 'setSpecialties', 'setLoading', 'setSearchTerm',
    'setFilterFloor', 'setFilterSpecialty', 'setFilterStatus',
    'setViewMode', 'setStats',
    'setShowCreateModal', 'setShowEditModal', 'setShowDeleteModal',
    'setSelectedRoom'
];

for (const setter of simpleSetters) {
    const stateKey = setter.charAt(3).toLowerCase() + setter.slice(4);
    // Handle setter calls - need to find matching parenthesis
    let idx = 0;
    while (true) {
        const pos = code.indexOf(setter + '(', idx);
        if (pos === -1) break;

        // Make sure it's not part of a larger word
        if (pos > 0 && /\w/.test(code[pos - 1])) {
            idx = pos + 1;
            continue;
        }

        // Find the matching closing paren
        let depth = 0;
        let start = pos + setter.length;
        let end = start;
        for (let i = start; i < code.length; i++) {
            if (code[i] === '(') depth++;
            else if (code[i] === ')') {
                depth--;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }

        const innerContent = code.substring(start + 1, end);
        const replacement = `this.setState({ ${stateKey}: ${innerContent} })`;
        code = code.substring(0, pos) + replacement + code.substring(end + 1);
        idx = pos + replacement.length;
    }
}

// 6. Handle setFormData specially - setFormData({ ...formData, key: val }) -> this.setState({ formData: { ...this.state.formData, key: val } })
{
    let idx = 0;
    while (true) {
        const pos = code.indexOf('setFormData(', idx);
        if (pos === -1) break;

        if (pos > 0 && /\w/.test(code[pos - 1])) {
            idx = pos + 1;
            continue;
        }

        let depth = 0;
        let start = pos + 'setFormData'.length;
        let end = start;
        for (let i = start; i < code.length; i++) {
            if (code[i] === '(') depth++;
            else if (code[i] === ')') {
                depth--;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }

        let innerContent = code.substring(start + 1, end);
        // Replace ...formData with ...this.state.formData
        innerContent = innerContent.replace(/\.\.\.formData/g, '...this.state.formData');
        const replacement = `this.setState({ formData: ${innerContent} })`;
        code = code.substring(0, pos) + replacement + code.substring(end + 1);
        idx = pos + replacement.length;
    }
}

// 7. Replace bare function calls with this. prefix for class methods
const methods = [
    'fetchRooms', 'fetchSpecialties', 'fetchStats',
    'handleCreate', 'handleCreateRoom', 'handleEdit', 'handleUpdateRoom',
    'handleDelete', 'confirmDelete', 'getStatusBadge', 'getSpecialtyColor'
];

for (const method of methods) {
    // Replace standalone calls (not already prefixed with this.)
    const regex = new RegExp('(?<!this\\.)(?<!\\w)' + method + '(?=\\()', 'g');
    code = code.replace(regex, 'this.' + method);
}

// 8. Replace navigate() with this.props.navigate()
code = code.replace(/(?<!this\.props\.)(?<!\w)navigate\(/g, 'this.props.navigate(');

// 9. Replace bare state variable access in JSX/logic with this.state.
// Need to handle: rooms, specialties, loading, searchTerm, filterFloor, filterSpecialty, filterStatus, viewMode, stats, showCreateModal, showEditModal, showDeleteModal, selectedRoom, formData
const stateVars = [
    'rooms', 'specialties', 'loading', 'searchTerm',
    'filterFloor', 'filterSpecialty', 'filterStatus',
    'viewMode', 'stats',
    'showCreateModal', 'showEditModal', 'showDeleteModal',
    'selectedRoom', 'formData'
];

// Add render() method wrapper and destructure state
// First find "    if (loading && rooms.length === 0) {"
code = code.replace(
    "    // Nhóm phòng theo tầng\n" +
    "    const roomsByFloor = rooms.reduce",
    "    render() {\n" +
    "        const { navigate } = this.props;\n" +
    "        const { rooms, specialties, loading, searchTerm, filterFloor, filterSpecialty, filterStatus, viewMode, stats, showCreateModal, showEditModal, showDeleteModal, selectedRoom, formData } = this.state;\n" +
    "\n" +
    "        // Nhóm phòng theo tầng\n" +
    "        const roomsByFloor = rooms.reduce"
);

// 10. Fix the closing: replace final "}" with render close + class close + export
code = code.replace(/    \);\n\}$/, '        );\n    }\n}\n\nexport default withRouter(AdminRooms);');

// 11. In methods (before render), state vars need this.state. prefix
// But in render() we destructured, so those are fine
// We need to fix references in methods (fetchRooms, handleCreate, etc.)

// Split at render() to handle methods vs render separately
const renderIdx = code.indexOf('    render() {');
if (renderIdx !== -1) {
    let methodsPart = code.substring(0, renderIdx);
    let renderPart = code.substring(renderIdx);

    // In methods part, replace bare state variable references
    for (const v of stateVars) {
        // Replace state var access that's not already prefixed
        // Be careful not to replace inside strings or property names
        const vreg = new RegExp('(?<!this\\.state\\.)(?<!this\\.)(?<!\\.)(?<![\'"`\\w])(' + v + ')(?=[^\\w])', 'g');
        methodsPart = methodsPart.replace(vreg, (match, p1, offset) => {
            // Don't replace in constructor state definition
            const before = methodsPart.substring(Math.max(0, offset - 50), offset);
            if (before.includes('this.state = {') || before.includes('this.state = {\n')) {
                // Check if we're inside the constructor state definition
                const constructorStart = methodsPart.indexOf('constructor(props)');
                const constructorEnd = methodsPart.indexOf('\n    }', constructorStart);
                if (offset > constructorStart && offset < constructorEnd) {
                    return p1; // Don't prefix in constructor
                }
            }
            return 'this.state.' + p1;
        });
    }

    code = methodsPart + renderPart;
}

// 12. Fix double this.state.this.state. if any
code = code.replace(/this\.state\.this\.state\./g, 'this.state.');

// 13. Fix: in methods, formData references inside setState should use this.state.formData
// Already handled by the setFormData converter above

// 14. Fix any remaining issues with this.state. in wrong places
// e.g., const params = new URLSearchParams(); if (this.state.searchTerm) ... 
// This is actually correct for methods!

// 15. Remove "this.state." from params in function signatures  
// e.g., "this.handleCreate(parseInt(this.state.floor))" - floor here is a local var in JSX, which is destructured
// In render part, local destructured vars are used, so no this.state. needed there

// 16. Fix: "this.this.fetchRooms" or similar double this
code = code.replace(/this\.this\./g, 'this.');

// 17. Fix: in the render destructuring, variables should NOT have this.state prefix
// The render part already uses destructured vars, which is correct

// Write the result
fs.writeFileSync(filePath, code, 'utf8');
console.log('AdminRooms.jsx converted successfully!');
