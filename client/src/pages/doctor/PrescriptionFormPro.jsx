import React, { Component, createRef } from 'react';
import api from '../../utils/api';
import styles from './PrescriptionFormPro.module.css';

class PrescriptionFormPro extends Component {
    constructor(props) {
        super(props);
        this.state = {
            drugs: [],
            filteredDrugs: [],
            searchTerm: '',
            showDrugSearch: false,
            activeItemIndex: null,
            loading: false,
            saving: false,
            prescriptionItems: [],
            generalNote: '',
            diagnosis: props.appointment?.diagnosis || '',
            reExamDate: '',
            simpleMode: true, // ✅ Mặc định dùng chế độ đơn giản
            showQuickAdd: false // ✅ Thêm thuốc nhanh
        };
        this.searchInputRef = createRef();

        // ✅ Preset liều dùng phổ biến nhất (hiển thị ở chế độ đơn giản)
        this.quickDosagePresets = [
            { label: 'Sáng 1 - Tối 1', morning: 1, noon: 0, afternoon: 0, evening: 1 },
            { label: 'Ngày 3 lần', morning: 1, noon: 1, afternoon: 0, evening: 1 },
            { label: 'Ngày 1 viên', morning: 1, noon: 0, afternoon: 0, evening: 0 },
            { label: 'Ngày 2 viên', morning: 1, noon: 0, afternoon: 0, evening: 1 },
        ];

        this.dosagePresets = [
            'Sáng 1 viên - Tối 1 viên',
            'Sáng 1 viên - Trưa 1 viên - Tối 1 viên',
            'Sáng 2 viên - Tối 2 viên',
            'Ngày 1 viên',
            'Ngày 2 viên',
            'Ngày 3 viên',
            'Khi cần',
            'Uống trước ăn 30 phút',
            'Uống sau ăn',
            'Uống khi đói',
        ];

        // ✅ Chỉ hiển thị 3 đường dùng phổ biến ở chế độ đơn giản
        this.usagePresetsSimple = [
            { label: 'Uống', value: 'uống', icon: '💊', needDosage: true },
            { label: 'Bôi', value: 'bôi ngoài', icon: '🧴', needDosage: false, defaultUnit: 'tuýp' },
            { label: 'Khác', value: 'khác', icon: '📦', needDosage: false },
        ];

        this.usagePresets = [
            { label: 'Uống', value: 'uống', icon: '💊', needDosage: true },
            { label: 'Tiêm', value: 'tiêm', icon: '💉', needDosage: true },
            { label: 'Bôi ngoài', value: 'bôi ngoài', icon: '🧴', needDosage: false, defaultUnit: 'tuýp' },
            { label: 'Nhỏ mắt', value: 'nhỏ mắt', icon: '👁️', needDosage: false, defaultUnit: 'lọ' },
            { label: 'Nhỏ mũi', value: 'nhỏ mũi', icon: '👃', needDosage: false, defaultUnit: 'lọ' },
            { label: 'Xịt họng', value: 'xịt họng', icon: '🌬️', needDosage: false, defaultUnit: 'chai' },
            { label: 'Đặt hậu môn', value: 'đặt hậu môn', icon: '💠', needDosage: true },
            { label: 'Ngậm', value: 'ngậm', icon: '👅', needDosage: true },
        ];

        this.durationPresets = [
            '3 ngày',
            '5 ngày',
            '7 ngày',
            '10 ngày',
            '14 ngày',
            '21 ngày',
            '30 ngày',
            'Đến khi hết triệu chứng',
        ];
    }

    componentDidMount() {
        this.fetchDrugs();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.searchTerm !== this.state.searchTerm || prevState.drugs !== this.state.drugs) {
            this.filterDrugs();
        }
    }

    filterDrugs = () => {
        const { searchTerm, drugs } = this.state;
        if (searchTerm.length > 0) {
            const filtered = drugs.filter(drug =>
                drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (drug.ingredient && drug.ingredient.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            this.setState({ filteredDrugs: filtered });
        } else {
            this.setState({ filteredDrugs: drugs });
        }
    };

    needsDosageCalculation = (usageType) => {
        const preset = this.usagePresets.find(p => p.value === usageType);
        return preset ? preset.needDosage : true;
    };

    getDefaultUnit = (usageType, drugUnit) => {
        const preset = this.usagePresets.find(p => p.value === usageType);
        return preset?.defaultUnit || drugUnit || 'viên';
    };

    fetchDrugs = async () => {
        try {
            this.setState({ loading: true });
            const response = await api.get('/api/public/drugs');
            const drugList = response.data.drugs || response.data.data || [];
            this.setState({ drugs: drugList, filteredDrugs: drugList });
        } catch (error) {
            console.error('Error fetching drugs:', error);
            try {
                const response = await api.get('/api/admin/drugs?limit=1000');
                const drugList = response.data.data || [];
                this.setState({ drugs: drugList, filteredDrugs: drugList });
            } catch (err) {
                console.error('Error fetching drugs (alt):', err);
            }
        } finally {
            this.setState({ loading: false });
        }
    };

    openDrugSearch = (index) => {
        this.setState({
            activeItemIndex: index,
            showDrugSearch: true,
            searchTerm: ''
        }, () => {
            setTimeout(() => this.searchInputRef.current?.focus(), 100);
        });
    };

    selectDrug = (drug) => {
        const { activeItemIndex, prescriptionItems } = this.state;
        if (activeItemIndex !== null) {
            const updated = [...prescriptionItems];
            updated[activeItemIndex] = {
                ...updated[activeItemIndex],
                drug_id: drug.id,
                drug_name: drug.name,
                drug_ingredient: drug.ingredient,
                drug_unit: drug.unit || 'viên',
                drug_stock: drug.quantity || drug.stock_quantity || 0,
                drug_price: drug.price || 0,
                unit: drug.unit || 'viên'
            };
            this.setState({ prescriptionItems: updated });
        }
        this.setState({ showDrugSearch: false, activeItemIndex: null });
    };

    // ✅ Thêm thuốc nhanh với liều dùng mặc định
    quickAddDrug = (drug, dosagePreset = null) => {
        const preset = dosagePreset || this.quickDosagePresets[0]; // Mặc định: Sáng 1 - Tối 1
        const durationDays = 7;
        const totalPerDay = preset.morning + preset.noon + preset.afternoon + preset.evening;
        const totalQuantity = totalPerDay * durationDays;

        const parts = [];
        if (preset.morning > 0) parts.push(`Sáng ${preset.morning}`);
        if (preset.noon > 0) parts.push(`Trưa ${preset.noon}`);
        if (preset.afternoon > 0) parts.push(`Chiều ${preset.afternoon}`);
        if (preset.evening > 0) parts.push(`Tối ${preset.evening}`);
        const dosageText = parts.join(' - ') + ` ${drug.unit || 'viên'}`;

        this.setState(prevState => ({
            prescriptionItems: [...prevState.prescriptionItems, {
                drug_id: drug.id,
                drug_name: drug.name,
                drug_ingredient: drug.ingredient,
                drug_unit: drug.unit || 'viên',
                drug_stock: drug.quantity || drug.stock_quantity || 0,
                drug_price: drug.price || 0,
                quantity: totalQuantity,
                unit: drug.unit || 'viên',
                usage_type: 'uống',
                morning: preset.morning,
                noon: preset.noon,
                afternoon: preset.afternoon,
                evening: preset.evening,
                dosage: dosageText,
                duration: '7 ngày',
                timing: 'sau ăn',
                note: ''
            }],
            showDrugSearch: false,
            showQuickAdd: false
        }));
    };

    addNewItem = () => {
        this.setState(prevState => ({
            prescriptionItems: [...prevState.prescriptionItems, {
                drug_id: '',
                drug_name: '',
                drug_ingredient: '',
                drug_unit: 'viên',
                drug_stock: 0,
                drug_price: 0,
                quantity: 1,
                unit: 'viên',
                usage_type: 'uống',
                morning: 0,
                noon: 0,
                afternoon: 0,
                evening: 0,
                dosage: '',
                duration: '7 ngày',
                timing: 'sau ăn',
                note: ''
            }]
        }));
    };

    removeItem = (index) => {
        if (this.state.prescriptionItems.length > 0) {
            this.setState(prevState => ({
                prescriptionItems: prevState.prescriptionItems.filter((_, i) => i !== index)
            }));
        }
    };

    updateItem = (index, field, value) => {
        const updated = [...this.state.prescriptionItems];
        updated[index][field] = value;

        if (field === 'usage_type') {
            const preset = this.usagePresets.find(p => p.value === value);
            if (preset && !preset.needDosage) {
                updated[index].morning = 0;
                updated[index].noon = 0;
                updated[index].afternoon = 0;
                updated[index].evening = 0;
                updated[index].dosage = '';
                if (preset.defaultUnit) {
                    updated[index].unit = preset.defaultUnit;
                }
                if (!updated[index].quantity || updated[index].quantity === 0) {
                    updated[index].quantity = 1;
                }
            }
        }

        if (['morning', 'noon', 'afternoon', 'evening', 'duration'].includes(field)) {
            const item = updated[index];

            if (this.needsDosageCalculation(item.usage_type)) {
                const parts = [];
                if (parseInt(item.morning) > 0) parts.push(`Sáng ${item.morning} ${item.unit}`);
                if (parseInt(item.noon) > 0) parts.push(`Trưa ${item.noon} ${item.unit}`);
                if (parseInt(item.afternoon) > 0) parts.push(`Chiều ${item.afternoon} ${item.unit}`);
                if (parseInt(item.evening) > 0) parts.push(`Tối ${item.evening} ${item.unit}`);
                updated[index].dosage = parts.join(' - ');

                const totalPerDay = (parseInt(item.morning) || 0) + (parseInt(item.noon) || 0) +
                    (parseInt(item.afternoon) || 0) + (parseInt(item.evening) || 0);

                const durationMatch = String(item.duration).match(/(\d+)/);
                const durationDays = durationMatch ? parseInt(durationMatch[1]) : 0;

                if (totalPerDay > 0 && durationDays > 0) {
                    updated[index].quantity = totalPerDay * durationDays;
                }
            }
        }

        this.setState({ prescriptionItems: updated });
    };

    calculateTotalQuantity = (item) => {
        const perDay = (parseInt(item.morning) || 0) + (parseInt(item.noon) || 0) +
            (parseInt(item.afternoon) || 0) + (parseInt(item.evening) || 0);
        const days = parseInt(item.duration) || 0;
        return perDay * days;
    };

    handleSavePrescription = async () => {
        const { prescriptionItems, generalNote, reExamDate } = this.state;
        const { appointment } = this.props;

        const validItems = prescriptionItems.filter(item => item.drug_id && item.quantity > 0);
        if (validItems.length === 0) {
            alert('Vui lòng thêm ít nhất một loại thuốc vào đơn!');
            return;
        }

        for (const item of validItems) {
            if (item.quantity > item.drug_stock) {
                alert(`Thuốc "${item.drug_name}" không đủ tồn kho!\nCần: ${item.quantity} ${item.unit}\nCòn: ${item.drug_stock} ${item.unit}`);
                return;
            }
        }

        try {
            this.setState({ saving: true });

            const payload = {
                booking_id: appointment.id,
                patient_id: appointment.patient_id,
                note: generalNote,
                re_exam_date: reExamDate || null,
                drugs: validItems.map(item => ({
                    drug_id: parseInt(item.drug_id),
                    quantity: parseInt(item.quantity),
                    unit: item.unit,
                    dosage: this.buildDosageText(item),
                    duration: item.duration,
                    note: item.note
                }))
            };

            const response = await api.post('/api/doctor/prescriptions', payload);

            if (response.data.success) {
                alert('✅ Đã kê đơn thuốc thành công!');
                this.props.onSuccess?.(response.data.data);
                this.props.onClose();
            } else {
                alert(response.data.message || 'Có lỗi xảy ra!');
            }
        } catch (error) {
            console.error('Error saving prescription:', error);
            alert(error.response?.data?.message || 'Lỗi khi lưu đơn thuốc!');
        } finally {
            this.setState({ saving: false });
        }
    };

    buildDosageText = (item) => {
        let text = '';

        if (!this.needsDosageCalculation(item.usage_type)) {
            const usageLabel = this.usagePresets.find(p => p.value === item.usage_type)?.label || item.usage_type;
            text = `${usageLabel} - ${item.quantity} ${item.unit}`;
            if (item.duration) {
                text += ` (dùng trong ${item.duration})`;
            }
            return text;
        }

        const parts = [];
        if (item.morning > 0) parts.push(`Sáng ${item.morning}`);
        if (item.noon > 0) parts.push(`Trưa ${item.noon}`);
        if (item.afternoon > 0) parts.push(`Chiều ${item.afternoon}`);
        if (item.evening > 0) parts.push(`Tối ${item.evening}`);

        if (parts.length > 0) {
            text = parts.join(' - ') + ` ${item.unit}`;
        } else if (item.dosage) {
            text = item.dosage;
        }

        if (item.timing) {
            text += ` (${item.timing})`;
        }

        return text;
    };

    getTotalCost = () => {
        return this.state.prescriptionItems.reduce((sum, item) => {
            return sum + (item.quantity * (item.drug_price || 0));
        }, 0);
    };

    render() {
        const { appointment, onClose } = this.props;
        const {
            filteredDrugs, searchTerm, showDrugSearch, activeItemIndex,
            loading, saving, prescriptionItems, generalNote, diagnosis,
            reExamDate, simpleMode, showQuickAdd
        } = this.state;

        return (
            <div className={styles.overlay}>
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1>📋 Kê Đơn Thuốc</h1>
                            <span className={styles.bookingCode}>#{appointment?.booking_code}</span>
                        </div>
                        <div className={styles.headerRight}>
                            <button 
                                className={`${styles.modeToggle} ${simpleMode ? styles.modeActive : ''}`}
                                onClick={() => this.setState({ simpleMode: !simpleMode })}
                                title={simpleMode ? 'Chuyển sang chế độ nâng cao' : 'Chuyển sang chế độ đơn giản'}
                            >
                                {simpleMode ? '⚡ Đơn giản' : '⚙️ Nâng cao'}
                            </button>
                            <button className={styles.closeBtn} onClick={onClose}>✕</button>
                        </div>
                    </div>

                    {/* Patient Info Bar */}
                    <div className={styles.patientBar}>
                        <div className={styles.patientInfo}>
                            <span className={styles.patientIcon}>👤</span>
                            <div>
                                <strong>{appointment?.patient_name || 'N/A'}</strong>
                                <span className={styles.patientMeta}>
                                    {appointment?.patient_phone} •
                                    {appointment?.patient_gender === 'male' ? ' Nam' : ' Nữ'}
                                    {appointment?.patient_dob && ` • ${calculateAge(appointment.patient_dob)} tuổi`}
                                </span>
                            </div>
                        </div>
                        <div className={styles.diagnosisInfo}>
                            <span className={styles.diagLabel}>Chẩn đoán:</span>
                            <span className={styles.diagText}>{diagnosis || appointment?.diagnosis || 'Chưa có'}</span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className={styles.mainContent}>
                        {/* Left: Drug List */}
                        <div className={styles.drugListSection}>
                            <div className={styles.sectionHeader}>
                                <h2>💊 Danh Sách Thuốc</h2>
                                <div className={styles.headerActions}>
                                    {simpleMode && (
                                        <button 
                                            className={styles.quickAddBtn} 
                                            onClick={() => this.setState({ showQuickAdd: true, showDrugSearch: true, activeItemIndex: null })}
                                        >
                                            ⚡ Thêm nhanh
                                        </button>
                                    )}
                                    <button className={styles.addDrugBtn} onClick={this.addNewItem}>
                                        + Thêm thuốc
                                    </button>
                                </div>
                            </div>

                            {prescriptionItems.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>💊</div>
                                    <p>Chưa có thuốc nào trong đơn</p>
                                    <button className={styles.addFirstBtn} onClick={this.addNewItem}>
                                        + Thêm thuốc đầu tiên
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.drugItems}>
                                    {prescriptionItems.map((item, index) => (
                                        <div key={index} className={styles.drugItem}>
                                            <div className={styles.drugItemHeader}>
                                                <span className={styles.drugNumber}>#{index + 1}</span>
                                                <button
                                                    className={styles.removeDrugBtn}
                                                    onClick={() => this.removeItem(index)}
                                                    title="Xóa thuốc này"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            {/* Drug Selection */}
                                            <div className={styles.drugSelector} onClick={() => this.openDrugSearch(index)}>
                                                {item.drug_name ? (
                                                    <div className={styles.selectedDrug}>
                                                        <div className={styles.drugName}>{item.drug_name}</div>
                                                        <div className={styles.drugMeta}>
                                                            {item.drug_ingredient && (
                                                                <span className={styles.ingredient}>
                                                                    📦 {item.drug_ingredient}
                                                                </span>
                                                            )}
                                                            <span className={styles.stock}>
                                                                Kho: {item.drug_stock} {item.drug_unit}
                                                            </span>
                                                            {item.drug_price > 0 && (
                                                                <span className={styles.price}>
                                                                    💰 {formatCurrency(item.drug_price)}/{item.drug_unit}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={styles.drugPlaceholder}>
                                                        🔍 Nhấn để tìm và chọn thuốc...
                                                    </div>
                                                )}
                                            </div>

                                            {/* Usage Type */}
                                            <div className={styles.usageTypeRow}>
                                                <label>Đường dùng:</label>
                                                <div className={styles.usageTypes}>
                                                    {(simpleMode ? this.usagePresetsSimple : this.usagePresets).map(preset => (
                                                        <button
                                                            key={preset.value}
                                                            className={`${styles.usageBtn} ${item.usage_type === preset.value ? styles.active : ''}`}
                                                            onClick={() => this.updateItem(index, 'usage_type', preset.value)}
                                                        >
                                                            {preset.icon} {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ✅ Simple Mode: Quick Dosage Presets */}
                                            {simpleMode && this.needsDosageCalculation(item.usage_type) && (
                                                <div className={styles.quickDosageRow}>
                                                    <label>⚡ Liều nhanh:</label>
                                                    <div className={styles.quickDosageButtons}>
                                                        {this.quickDosagePresets.map((preset, i) => (
                                                            <button
                                                                key={i}
                                                                className={styles.quickDosageBtn}
                                                                onClick={() => {
                                                                    this.updateItem(index, 'morning', preset.morning);
                                                                    this.updateItem(index, 'noon', preset.noon);
                                                                    this.updateItem(index, 'afternoon', preset.afternoon);
                                                                    this.updateItem(index, 'evening', preset.evening);
                                                                }}
                                                            >
                                                                {preset.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dosage Grid - Only show for types that need dosage */}
                                            {this.needsDosageCalculation(item.usage_type) ? (
                                                <div className={styles.dosageGrid}>
                                                    <div className={styles.dosageTitle}>Liều lượng mỗi ngày:</div>
                                                    <div className={styles.dosageInputs}>
                                                        <div className={styles.dosageItem}>
                                                            <label>🌅 Sáng</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.morning || ''}
                                                                onChange={(e) => this.updateItem(index, 'morning', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div className={styles.dosageItem}>
                                                            <label>☀️ Trưa</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.noon || ''}
                                                                onChange={(e) => this.updateItem(index, 'noon', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div className={styles.dosageItem}>
                                                            <label>🌤️ Chiều</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.afternoon || ''}
                                                                onChange={(e) => this.updateItem(index, 'afternoon', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div className={styles.dosageItem}>
                                                            <label>🌙 Tối</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.evening || ''}
                                                                onChange={(e) => this.updateItem(index, 'evening', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={styles.directQuantityNote}>
                                                    <div className={styles.noteIcon}>💡</div>
                                                    <span>Thuốc {item.usage_type} - Nhập trực tiếp số lượng bên dưới</span>
                                                </div>
                                            )}

                                            {/* Duration & Timing */}
                                            <div className={styles.durationRow}>
                                                <div className={styles.durationSelect}>
                                                    <label>⏱️ Thời gian dùng:</label>
                                                    <select
                                                        value={item.duration}
                                                        onChange={(e) => this.updateItem(index, 'duration', e.target.value)}
                                                    >
                                                        {this.durationPresets.map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className={styles.timingSelect}>
                                                    <label>🕐 Thời điểm:</label>
                                                    <select
                                                        value={item.timing}
                                                        onChange={(e) => this.updateItem(index, 'timing', e.target.value)}
                                                    >
                                                        <option value="trước ăn">Trước ăn</option>
                                                        <option value="sau ăn">Sau ăn</option>
                                                        <option value="trong khi ăn">Trong khi ăn</option>
                                                        <option value="khi đói">Khi đói</option>
                                                        <option value="trước khi ngủ">Trước khi ngủ</option>
                                                        <option value="khi cần">Khi cần</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Quantity & Summary */}
                                            <div className={styles.quantitySummary}>
                                                <div className={styles.quantityInput}>
                                                    <label>Tổng số lượng:</label>
                                                    <div className={styles.quantityControl}>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => this.updateItem(index, 'quantity', e.target.value)}
                                                        />
                                                        <span className={styles.unitLabel}>{item.unit}</span>
                                                    </div>
                                                    {this.needsDosageCalculation(item.usage_type) && (() => {
                                                        const totalPerDay = (parseInt(item.morning) || 0) + (parseInt(item.noon) || 0) +
                                                            (parseInt(item.afternoon) || 0) + (parseInt(item.evening) || 0);
                                                        const durationMatch = String(item.duration).match(/(\d+)/);
                                                        const durationDays = durationMatch ? parseInt(durationMatch[1]) : 0;
                                                        if (totalPerDay > 0 && durationDays > 0) {
                                                            return (
                                                                <span className={styles.quantityCalc}>
                                                                    = {totalPerDay} × {durationDays} ngày
                                                                </span>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                                {item.drug_price > 0 && (
                                                    <div className={styles.itemTotal}>
                                                        Thành tiền: <strong>{formatCurrency(item.quantity * item.drug_price)}</strong>
                                                    </div>
                                                )}
                                                {item.quantity > item.drug_stock && (
                                                    <div className={styles.stockWarning}>
                                                        ⚠️ Vượt quá tồn kho ({item.drug_stock} {item.unit})
                                                    </div>
                                                )}
                                            </div>

                                            {/* Note */}
                                            <div className={styles.drugNote}>
                                                <input
                                                    type="text"
                                                    placeholder="Ghi chú riêng cho thuốc này (nếu có)..."
                                                    value={item.note}
                                                    onChange={(e) => this.updateItem(index, 'note', e.target.value)}
                                                />
                                            </div>

                                            {/* Generated Dosage Preview */}
                                            {item.dosage && (
                                                <div className={styles.dosagePreview}>
                                                    📝 <strong>Cách dùng:</strong> {this.buildDosageText(item)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Summary & Notes */}
                        <div className={styles.summarySection}>
                            {/* Quick Dosage Templates */}
                            <div className={styles.quickTemplates}>
                                <h3>⚡ Mẫu liều dùng nhanh</h3>
                                <div className={styles.templateButtons}>
                                    {this.dosagePresets.slice(0, 6).map((preset, i) => (
                                        <button
                                            key={i}
                                            className={styles.templateBtn}
                                            onClick={() => {
                                                if (activeItemIndex !== null && prescriptionItems[activeItemIndex]) {
                                                    this.updateItem(activeItemIndex, 'dosage', preset);
                                                }
                                            }}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Re-examination Date */}
                            <div className={styles.reExamSection}>
                                <h3>📅 Ngày tái khám</h3>
                                <input
                                    type="date"
                                    value={reExamDate}
                                    onChange={(e) => this.setState({ reExamDate: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* General Note */}
                            <div className={styles.noteSection}>
                                <h3>📝 Lời dặn bệnh nhân</h3>
                                <textarea
                                    value={generalNote}
                                    onChange={(e) => this.setState({ generalNote: e.target.value })}
                                    placeholder="Nhập lời dặn chung cho bệnh nhân...&#10;VD: Uống thuốc đúng giờ, tái khám sau 7 ngày..."
                                    rows="4"
                                />
                            </div>

                            {/* Cost Summary */}
                            <div className={styles.costSummary}>
                                <h3>💰 Tổng chi phí thuốc</h3>
                                <div className={styles.costBreakdown}>
                                    {prescriptionItems.map((item, i) => item.drug_name && (
                                        <div key={i} className={styles.costLine}>
                                            <span>{item.drug_name} x{item.quantity}</span>
                                            <span>{formatCurrency(item.quantity * item.drug_price)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.totalLine}>
                                    <span>Tổng cộng:</span>
                                    <span className={styles.totalAmount}>{formatCurrency(this.getTotalCost())}</span>
                                </div>
                            </div>

                            {/* Prescription Preview */}
                            <div className={styles.previewSection}>
                                <h3>👁️ Xem trước đơn thuốc</h3>
                                <div className={styles.previewBox}>
                                    {prescriptionItems.filter(i => i.drug_name).length === 0 ? (
                                        <p className={styles.previewEmpty}>Chưa có thuốc</p>
                                    ) : (
                                        <ol className={styles.previewList}>
                                            {prescriptionItems.filter(i => i.drug_name).map((item, i) => (
                                                <li key={i}>
                                                    <strong>{item.drug_name}</strong>
                                                    <br />
                                                    <small>
                                                        SL: {item.quantity} {item.unit} •
                                                        {item.dosage && ` ${item.dosage}`}
                                                        {item.timing && ` (${item.timing})`}
                                                        {item.duration && ` • ${item.duration}`}
                                                    </small>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className={styles.footer}>
                        <div className={styles.footerInfo}>
                            <span>📊 {prescriptionItems.filter(i => i.drug_id).length} loại thuốc</span>
                            <span>💰 {formatCurrency(this.getTotalCost())}</span>
                        </div>
                        <div className={styles.footerActions}>
                            <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>
                                Hủy bỏ
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={this.handleSavePrescription}
                                disabled={saving || prescriptionItems.filter(i => i.drug_id).length === 0}
                            >
                                {saving ? '⏳ Đang lưu...' : '💾 Lưu đơn thuốc'}
                            </button>
                            <button
                                className={styles.savePrintBtn}
                                onClick={async () => {
                                    await this.handleSavePrescription();
                                }}
                                disabled={saving || prescriptionItems.filter(i => i.drug_id).length === 0}
                            >
                                🖨️ Lưu & In
                            </button>
                        </div>
                    </div>
                </div>

                {/* Drug Search Modal */}
                {showDrugSearch && (
                    <div className={styles.searchOverlay} onClick={() => this.setState({ showDrugSearch: false, showQuickAdd: false })}>
                        <div className={styles.searchModal} onClick={e => e.stopPropagation()}>
                            <div className={styles.searchHeader}>
                                <h3>{showQuickAdd ? '⚡ Thêm thuốc nhanh' : '🔍 Tìm thuốc'}</h3>
                                <button onClick={() => this.setState({ showDrugSearch: false, showQuickAdd: false })}>✕</button>
                            </div>
                            {showQuickAdd && (
                                <div className={styles.quickAddInfo}>
                                    💡 Nhấn vào thuốc để thêm nhanh với liều: <strong>Sáng 1 - Tối 1, 7 ngày</strong>
                                </div>
                            )}
                            <div className={styles.searchInput}>
                                <input
                                    ref={this.searchInputRef}
                                    type="text"
                                    placeholder="Nhập tên thuốc hoặc hoạt chất..."
                                    value={searchTerm}
                                    onChange={(e) => this.setState({ searchTerm: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.searchResults}>
                                {loading ? (
                                    <div className={styles.searchLoading}>Đang tải...</div>
                                ) : filteredDrugs.length === 0 ? (
                                    <div className={styles.noResults}>Không tìm thấy thuốc</div>
                                ) : (
                                    filteredDrugs.map(drug => (
                                        <div
                                            key={drug.id}
                                            className={`${styles.drugOption} ${showQuickAdd ? styles.drugOptionQuick : ''}`}
                                            onClick={() => showQuickAdd ? this.quickAddDrug(drug) : this.selectDrug(drug)}
                                        >
                                            <div className={styles.drugOptionMain}>
                                                <div className={styles.drugOptionName}>{drug.name}</div>
                                                <div className={styles.drugOptionMeta}>
                                                    {drug.ingredient && <span>📦 {drug.ingredient}</span>}
                                                    <span>Kho: {drug.quantity || drug.stock_quantity || 0} {drug.unit}</span>
                                                    {drug.price > 0 && <span>💰 {formatCurrency(drug.price)}</span>}
                                                </div>
                                            </div>
                                            {showQuickAdd && (
                                                <button className={styles.quickAddDrugBtn}>
                                                    ⚡ Thêm
                                                </button>
                                            )}
                                            {(drug.quantity || drug.stock_quantity || 0) <= (drug.warning_level || 10) && (
                                                <span className={styles.lowStock}>⚠️ Sắp hết</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default PrescriptionFormPro;

// Helper functions
function calculateAge(dob) {
    if (!dob) return '';
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount || 0);
}
