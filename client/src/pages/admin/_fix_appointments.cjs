const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Appointments.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add render() method before the if(loading) block
code = code.replace(
    "    if(loading) {\n        return <div className={styles.loading}>Đang tải...</div>;\n    }\n\n    return(",
    "    render() {\n        const { navigate } = this.props;\n        const { appointments, doctors, loading, filter, pagination, showConfirmModal, showCreateModal, showDetailModal, selectedAppointment, showStatusModal, statusAppointment, newStatus, formData } = this.state;\n\n        if(loading) {\n            return <div className={styles.loading}>Đang tải...</div>;\n        }\n\n        return("
);

// 2. Fix all JSX comment spacing: {/* ... */ } -> {/* ... */}
code = code.replace(/\{\/\*([^*]*)\*\/\s*\}/g, '{/*$1*/}');

// 3. Fix tag spacing: < div className = { styles.xxx } > -> <div className={styles.xxx}>
code = code.replace(/< div className = \{ styles\.(\w+) \} >/g, '<div className={styles.$1}>');

// 4. Fix </div > -> </div>
code = code.replace(/<\/div\s*>/g, '</div>');

// 5. Fix the indentation of TABLE section and everything after it
// The TABLE comment through the end of the JSX is at 4-space indent but should be at 12-space
// Find the TABLE section start
const tableStart = code.indexOf('            {/* TABLE */}');
if (tableStart === -1) {
    // It might be at wrong indent, search for just TABLE
    const wrongTableStart = code.indexOf('    {/* TABLE */}');
    if (wrongTableStart !== -1) {
        // Find the closing of the container div
        // Everything from {/* TABLE */} to the final </div> before ); needs 8 more spaces of indentation
        const beforeTable = code.substring(0, wrongTableStart);
        let afterTable = code.substring(wrongTableStart);

        // Find where the render return's JSX ends: look for the pattern "        </div>\n    );\n    }\n}"
        // The JSX content that needs re-indenting is from {/* TABLE */} to just before </div> closing of container

        // Re-indent: add 8 spaces to each line that starts with spaces in the table/pagination/modal sections
        // Split into lines and process
        const lines = afterTable.split('\n');
        const fixedLines = [];
        let inBadIndent = true;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if we've reached the final closing of the component
            if (line === 'export default withRouter(Appointments);') {
                fixedLines.push(line);
                inBadIndent = false;
                continue;
            }

            // The closing pattern: "        </div>" then "    );" then "    }" then "}"
            if (line === '        </div>' && i + 1 < lines.length && lines[i + 1].trim() === ');') {
                // This is the closing </div> of the container
                fixedLines.push('        </div>');
                inBadIndent = false;
                continue;
            }

            if (!inBadIndent) {
                fixedLines.push(line);
                continue;
            }

            // Lines that are part of the JSX content but at wrong indentation
            // Add 8 spaces to lines that have content
            if (line.trim() === '') {
                fixedLines.push('');
            } else {
                fixedLines.push('        ' + line);
            }
        }

        code = beforeTable + fixedLines.join('\n');
    }
}

// 6. Fix the closing: ensure proper render() closure
// Should end with:
//         </div>
//     );
//     }
// }
// 
// export default withRouter(Appointments);
if (!code.includes('    render() {')) {
    console.error('ERROR: render() method not found after fix!');
}

// 7. Clean up: ensure return( is properly followed
// Check for any remaining issues

fs.writeFileSync(filePath, code, 'utf8');
console.log('Appointments.jsx formatting fixed!');
