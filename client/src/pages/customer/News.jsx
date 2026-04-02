import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import styles from './News.module.css';

class News extends Component {
    constructor(props) {
        super(props);
        this.state = {
            articles: [],
            categories: [],
            featuredArticles: [],
            loading: true,
            searchTerm: '',
            selectedCategory: '',
            currentPage: 1,
            totalPages: 1
        };
    }

    componentDidMount() {
        this.fetchCategories();
        this.fetchFeaturedArticles();
        this.fetchArticles();
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevState.searchTerm !== this.state.searchTerm ||
            prevState.selectedCategory !== this.state.selectedCategory ||
            prevState.currentPage !== this.state.currentPage
        ) {
            this.fetchArticles();
        }
    }

    fetchCategories = async () => {
        try {
            const response = await api.get('/api/public/articles/categories');
            const data = response.data;
            if (Array.isArray(data)) {
                this.setState({ categories: data });
            } else if (data && Array.isArray(data.categories)) {
                this.setState({ categories: data.categories });
            } else {
                this.setState({ categories: [] });
            }
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            this.setState({ categories: [] });
        }
    };

    fetchFeaturedArticles = async () => {
        try {
            const response = await api.get('/api/public/articles/featured');
            const data = response.data;
            if (Array.isArray(data)) {
                this.setState({ featuredArticles: data });
            } else if (data && Array.isArray(data.articles)) {
                this.setState({ featuredArticles: data.articles });
            } else {
                this.setState({ featuredArticles: [] });
            }
        } catch (error) {
            console.error('❌ Error fetching featured articles:', error);
            this.setState({ featuredArticles: [] });
        }
    };

    fetchArticles = async () => {
        this.setState({ loading: true });
        try {
            const { currentPage, searchTerm, selectedCategory } = this.state;
            const params = {
                page: currentPage,
                limit: 9
            };

            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.category = selectedCategory;

            const response = await api.get('/api/public/articles', { params });
            this.setState({
                articles: response.data.articles || [],
                totalPages: response.data.pagination?.totalPages || 1
            });
        } catch (error) {
            console.error('❌ Error fetching articles:', error);
            this.setState({ articles: [], totalPages: 1 });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleSearch = (e) => {
        e.preventDefault();
        this.setState({ currentPage: 1 }, () => {
            this.fetchArticles();
        });
    };

    formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    formatViews = (views) => {
        if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'k';
        }
        return views;
    };

    getCategoryColor = (slug) => {
        const colors = {
            'suc-khoe-tong-quat': '#3498db',
            'dinh-duong': '#2ecc71',
            'tin-tuc-phong-kham': '#9b59b6',
            'benh-thuong-gap': '#e74c3c'
        };
        return colors[slug] || '#95a5a6';
    };

    render() {
        const { articles, categories, featuredArticles, loading, searchTerm, selectedCategory, currentPage, totalPages } = this.state;

        return (
            <div className={styles.newsContainer}>
                {featuredArticles.length > 0 && (
                    <section className={styles.heroSection}>
                        <div className={styles.heroContent}>
                            <div className={styles.mainFeatured}>
                                <Link to={`/news/${featuredArticles[0].slug}`} className={styles.mainFeaturedLink}>
                                    <div className={styles.mainFeaturedImage}>
                                        <img
                                            src={featuredArticles[0].thumbnail || 'https://via.placeholder.com/800x400'}
                                            alt={featuredArticles[0].title}
                                        />
                                        <div className={styles.mainFeaturedOverlay}>
                                            <span
                                                className={styles.categoryBadge}
                                                style={{ backgroundColor: this.getCategoryColor(featuredArticles[0].category?.slug) }}
                                            >
                                                {featuredArticles[0].category?.name}
                                            </span>
                                            <h2>{featuredArticles[0].title}</h2>
                                            <p>{featuredArticles[0].excerpt}</p>
                                            <div className={styles.articleMeta}>
                                                <span>📅 {this.formatDate(featuredArticles[0].published_at)}</span>
                                                <span>👁️ {this.formatViews(featuredArticles[0].views)} lượt xem</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            {featuredArticles.length > 1 && (
                                <div className={styles.sideFeatured}>
                                    {featuredArticles.slice(1, 3).map(article => (
                                        <Link
                                            key={article.id}
                                            to={`/news/${article.slug}`}
                                            className={styles.sideFeaturedCard}
                                        >
                                            <img
                                                src={article.thumbnail || 'https://via.placeholder.com/400x200'}
                                                alt={article.title}
                                            />
                                            <div className={styles.sideFeaturedContent}>
                                                <span
                                                    className={styles.categoryBadge}
                                                    style={{ backgroundColor: this.getCategoryColor(article.category?.slug) }}
                                                >
                                                    {article.category?.name}
                                                </span>
                                                <h3>{article.title}</h3>
                                                <div className={styles.articleMeta}>
                                                    <span>📅 {this.formatDate(article.published_at)}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                <section className={styles.filterSection}>
                    <div className={styles.filterContainer}>
                        <div className={styles.searchRow}>
                            <div className={styles.searchWrapper}>
                                <span className={styles.searchIcon}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm bài viết theo tiêu đề, nội dung..."
                                    value={searchTerm}
                                    onChange={(e) => this.setState({ searchTerm: e.target.value })}
                                    onKeyPress={(e) => e.key === 'Enter' && this.handleSearch(e)}
                                    className={styles.searchInput}
                                />
                                {searchTerm && (
                                    <button
                                        className={styles.clearSearch}
                                        onClick={() => this.setState({ searchTerm: '', currentPage: 1 })}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => this.setState({ selectedCategory: e.target.value, currentPage: 1 })}
                                className={styles.categorySelect}
                            >
                                <option value="">📂 Tất cả danh mục</option>
                                {Array.isArray(categories) && categories.map(cat => (
                                    <option key={cat.id} value={cat.slug}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <button onClick={this.handleSearch} className={styles.searchButton}>
                                Tìm kiếm
                            </button>
                        </div>

                        <div className={styles.categoryTabs}>
                            <button
                                className={`${styles.categoryTab} ${!selectedCategory ? styles.active : ''}`}
                                onClick={() => this.setState({ selectedCategory: '', currentPage: 1 })}
                            >
                                Tất cả
                            </button>
                            {Array.isArray(categories) && categories.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`${styles.categoryTab} ${selectedCategory === cat.slug ? styles.active : ''}`}
                                    onClick={() => this.setState({ selectedCategory: cat.slug, currentPage: 1 })}
                                    style={selectedCategory === cat.slug ? { backgroundColor: this.getCategoryColor(cat.slug), borderColor: this.getCategoryColor(cat.slug) } : {}}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {(searchTerm || selectedCategory) && (
                            <div className={styles.searchInfo}>
                                <span>
                                    {searchTerm && `Kết quả cho "${searchTerm}"`}
                                    {searchTerm && selectedCategory && ' trong '}
                                    {selectedCategory && `danh mục "${categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}"`}
                                </span>
                                <button
                                    className={styles.clearFilters}
                                    onClick={() => this.setState({ searchTerm: '', selectedCategory: '', currentPage: 1 })}
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                <section className={styles.articlesSection}>
                    <div className={styles.articlesContainer}>
                        {loading ? (
                            <div className={styles.loading}>
                                <div className={styles.spinner}></div>
                                <p>Đang tải bài viết...</p>
                            </div>
                        ) : articles.length === 0 ? (
                            <div className={styles.noResults}>
                                <p>Không tìm thấy bài viết nào.</p>
                            </div>
                        ) : (
                            <>
                                <div className={styles.articlesGrid}>
                                    {articles.map(article => (
                                        <Link
                                            key={article.id}
                                            to={`/news/${article.slug}`}
                                            className={styles.articleCard}
                                        >
                                            <div className={styles.articleImage}>
                                                <img
                                                    src={article.thumbnail || 'https://via.placeholder.com/400x250'}
                                                    alt={article.title}
                                                />
                                                <span
                                                    className={styles.categoryBadge}
                                                    style={{ backgroundColor: this.getCategoryColor(article.category?.slug) }}
                                                >
                                                    {article.category?.name}
                                                </span>
                                            </div>
                                            <div className={styles.articleContent}>
                                                <h3>{article.title}</h3>
                                                <p>{article.excerpt}</p>
                                                <div className={styles.articleFooter}>
                                                    <span className={styles.date}>
                                                        📅 {this.formatDate(article.published_at)}
                                                    </span>
                                                    <span className={styles.views}>
                                                        👁️ {this.formatViews(article.views)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className={styles.pagination}>
                                        <button
                                            onClick={() => this.setState(prev => ({ currentPage: Math.max(1, prev.currentPage - 1) }))}
                                            disabled={currentPage === 1}
                                            className={styles.paginationButton}
                                        >
                                            ← Trước
                                        </button>

                                        <div className={styles.pageNumbers}>
                                            {[...Array(totalPages)].map((_, index) => (
                                                <button
                                                    key={index + 1}
                                                    onClick={() => this.setState({ currentPage: index + 1 })}
                                                    className={`${styles.pageNumber} ${currentPage === index + 1 ? styles.active : ''}`}
                                                >
                                                    {index + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => this.setState(prev => ({ currentPage: Math.min(totalPages, prev.currentPage + 1) }))}
                                            disabled={currentPage === totalPages}
                                            className={styles.paginationButton}
                                        >
                                            Sau →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
        );
    }
}

export default News;
