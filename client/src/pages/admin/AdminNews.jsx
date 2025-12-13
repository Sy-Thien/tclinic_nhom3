import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './AdminNews.module.css';

export default function AdminNews() {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category_id: '',
        thumbnail: '',
        status: 'draft',
        is_featured: false
    });

    // Category form
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchData();
    }, [filterCategory, filterStatus, pagination.page]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', pagination.page);
            params.append('limit', 15);
            if (filterCategory !== 'all') params.append('category', filterCategory);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (searchTerm) params.append('search', searchTerm);

            const [articlesRes, categoriesRes] = await Promise.all([
                api.get(`/api/articles/admin/list?${params.toString()}`),
                api.get('/api/articles/admin/categories')
            ]);

            setArticles(articlesRes.data.articles || []);
            setPagination(prev => ({
                ...prev,
                totalPages: articlesRes.data.pagination?.totalPages || 1,
                total: articlesRes.data.pagination?.total || 0
            }));
            setCategories(categoriesRes.data.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchData();
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name || 'Chưa phân loại';
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            draft: { label: 'Nháp', class: styles.statusDraft },
            published: { label: 'Đã xuất bản', class: styles.statusPublished },
            archived: { label: 'Lưu trữ', class: styles.statusArchived }
        };
        const info = statusMap[status] || statusMap.draft;
        return <span className={`${styles.statusBadge} ${info.class}`}>{info.label}</span>;
    };

    // Open modal for adding
    const handleAdd = () => {
        setModalMode('add');
        setSelectedArticle(null);
        setFormData({
            title: '',
            content: '',
            excerpt: '',
            category_id: '',
            thumbnail: '',
            status: 'draft',
            is_featured: false
        });
        setShowModal(true);
    };

    // Open modal for editing
    const handleEdit = async (article) => {
        try {
            const res = await api.get(`/api/articles/admin/article/${article.id}`);
            const data = res.data.data;
            setModalMode('edit');
            setSelectedArticle(data);
            setFormData({
                title: data.title || '',
                content: data.content || '',
                excerpt: data.excerpt || '',
                category_id: data.category_id || '',
                thumbnail: data.thumbnail || '',
                status: data.status || 'draft',
                is_featured: data.is_featured || false
            });
            setShowModal(true);
        } catch (error) {
            console.error('Error loading article:', error);
            alert('❌ Không thể tải thông tin bài viết');
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert('Vui lòng nhập tiêu đề bài viết');
            return;
        }

        if (!formData.content.trim()) {
            alert('Vui lòng nhập nội dung bài viết');
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                excerpt: formData.excerpt.trim() || formData.content.substring(0, 200),
                category_id: formData.category_id || null,
                thumbnail: formData.thumbnail.trim() || null,
                status: formData.status,
                is_featured: formData.is_featured
            };

            if (modalMode === 'add') {
                await api.post('/api/articles/admin/article', payload);
                alert('✅ Thêm bài viết thành công!');
            } else {
                await api.put(`/api/articles/admin/article/${selectedArticle.id}`, payload);
                alert('✅ Cập nhật bài viết thành công!');
            }

            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving article:', error);
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể lưu bài viết'));
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (article) => {
        if (!confirm(`Bạn có chắc muốn xóa bài viết "${article.title}"?`)) {
            return;
        }

        try {
            await api.delete(`/api/articles/admin/article/${article.id}`);
            alert('✅ Xóa bài viết thành công!');
            fetchData();
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể xóa bài viết'));
        }
    };

    // Quick status change
    const handleStatusChange = async (article, newStatus) => {
        try {
            await api.put(`/api/articles/admin/article/${article.id}`, { status: newStatus });
            fetchData();
        } catch (error) {
            console.error('Error changing status:', error);
            alert('❌ Lỗi thay đổi trạng thái');
        }
    };

    // Category management
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!categoryForm.name.trim()) {
            alert('Vui lòng nhập tên danh mục');
            return;
        }

        try {
            await api.post('/api/articles/admin/category', categoryForm);
            alert('✅ Thêm danh mục thành công!');
            setCategoryForm({ name: '', description: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding category:', error);
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể thêm danh mục'));
        }
    };

    const handleDeleteCategory = async (cat) => {
        if (!confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) return;

        try {
            await api.delete(`/api/articles/admin/category/${cat.id}`);
            alert('✅ Xóa danh mục thành công!');
            fetchData();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể xóa danh mục'));
        }
    };

    // Stats
    const totalArticles = pagination.total;
    const publishedCount = articles.filter(a => a.status === 'published').length;
    const draftCount = articles.filter(a => a.status === 'draft').length;
    const featuredCount = articles.filter(a => a.is_featured).length;

    if (loading && articles.length === 0) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>📰 Quản lý Tin tức</h1>
                    <p>Quản lý bài viết và tin tức y tế</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.btnCategory} onClick={() => setShowCategoryModal(true)}>
                        📂 Danh mục
                    </button>
                    <button className={styles.btnAdd} onClick={handleAdd}>
                        Thêm bài viết
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📋</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{totalArticles}</span>
                        <span className={styles.statLabel}>Tổng bài viết</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{publishedCount}</span>
                        <span className={styles.statLabel}>Đã xuất bản</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{draftCount}</span>
                        <span className={styles.statLabel}>Bản nháp</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>⭐</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{featuredCount}</span>
                        <span className={styles.statLabel}>Nổi bật</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <form className={styles.searchBox} onSubmit={handleSearch}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài viết..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className={styles.searchBtn}>Tìm</button>
                </form>
                <select
                    value={filterCategory}
                    onChange={(e) => {
                        setFilterCategory(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className={styles.filterSelect}
                >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.articleCount || 0})
                        </option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className={styles.filterSelect}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="published">Đã xuất bản</option>
                    <option value="draft">Bản nháp</option>
                    <option value="archived">Lưu trữ</option>
                </select>
            </div>

            {/* Articles Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>ID</th>
                            <th>Tiêu đề</th>
                            <th style={{ width: '120px' }}>Danh mục</th>
                            <th style={{ width: '110px' }}>Trạng thái</th>
                            <th style={{ width: '80px' }}>Lượt xem</th>
                            <th style={{ width: '140px' }}>Ngày tạo</th>
                            <th style={{ width: '140px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.length === 0 ? (
                            <tr>
                                <td colSpan="7" className={styles.emptyRow}>
                                    Không tìm thấy bài viết nào
                                </td>
                            </tr>
                        ) : (
                            articles.map(article => (
                                <tr key={article.id}>
                                    <td className={styles.idCell}>{article.id}</td>
                                    <td className={styles.titleCell}>
                                        <div className={styles.articleTitle}>
                                            {article.is_featured && <span className={styles.featuredIcon}>⭐</span>}
                                            {article.title}
                                        </div>
                                        {article.excerpt && (
                                            <div className={styles.articleExcerpt}>
                                                {article.excerpt.substring(0, 80)}...
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.categoryBadge}>
                                            {getCategoryName(article.category_id)}
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(article.status)}</td>
                                    <td className={styles.viewsCell}>{article.views || 0}</td>
                                    <td className={styles.dateCell}>{formatDate(article.created_at)}</td>
                                    <td className={styles.actionsCell}>
                                        {article.status === 'draft' && (
                                            <button
                                                className={styles.btnPublish}
                                                onClick={() => handleStatusChange(article, 'published')}
                                                title="Xuất bản"
                                            >
                                                🚀
                                            </button>
                                        )}
                                        {article.status === 'published' && (
                                            <button
                                                className={styles.btnUnpublish}
                                                onClick={() => handleStatusChange(article, 'draft')}
                                                title="Hủy xuất bản"
                                            >
                                                📥
                                            </button>
                                        )}
                                        <button
                                            className={styles.btnEdit}
                                            onClick={() => handleEdit(article)}
                                            title="Sửa"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            className={styles.btnDelete}
                                            onClick={() => handleDelete(article)}
                                            title="Xóa"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                        ← Trước
                    </button>
                    <span className={styles.pageInfo}>
                        Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                        className={styles.pageBtn}
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                        Sau →
                    </button>
                </div>
            )}

            {/* Article Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{modalMode === 'add' ? 'Thêm bài viết mới' : 'Sửa bài viết'}</h2>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Tiêu đề <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Nhập tiêu đề bài viết"
                                    required
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Danh mục</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Trạng thái</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="draft">Bản nháp</option>
                                        <option value="published">Xuất bản ngay</option>
                                        <option value="archived">Lưu trữ</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Link ảnh thumbnail</label>
                                <input
                                    type="text"
                                    value={formData.thumbnail}
                                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Mô tả ngắn</label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    placeholder="Mô tả ngắn về bài viết (hiển thị ở trang danh sách)..."
                                    rows={2}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Nội dung <span className={styles.required}>*</span></label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Nội dung chi tiết bài viết..."
                                    rows={10}
                                    required
                                />
                            </div>

                            <div className={styles.checkboxGroup}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                    />
                                    ⭐ Đánh dấu là bài viết nổi bật
                                </label>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnSubmit} disabled={submitting}>
                                    {submitting ? 'Đang lưu...' : (modalMode === 'add' ? 'Thêm' : 'Lưu')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader}>
                            <h2>📂 Quản lý danh mục</h2>
                            <button className={styles.closeBtn} onClick={() => setShowCategoryModal(false)}>✕</button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Add Category Form */}
                            <form onSubmit={handleAddCategory} className={styles.categoryForm}>
                                <input
                                    type="text"
                                    placeholder="Tên danh mục mới..."
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                />
                                <button type="submit" className={styles.btnAdd}>➕ Thêm</button>
                            </form>

                            {/* Category List */}
                            <div className={styles.categoryList}>
                                {categories.length === 0 ? (
                                    <p className={styles.emptyText}>Chưa có danh mục nào</p>
                                ) : (
                                    categories.map(cat => (
                                        <div key={cat.id} className={styles.categoryItem}>
                                            <div className={styles.categoryInfo}>
                                                <span className={styles.categoryName}>{cat.name}</span>
                                                <span className={styles.categoryCount}>
                                                    {cat.articleCount || 0} bài viết
                                                </span>
                                            </div>
                                            <button
                                                className={styles.btnDeleteSmall}
                                                onClick={() => handleDeleteCategory(cat)}
                                                title="Xóa danh mục"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
