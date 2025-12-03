import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import styles from './News.module.css';

const News = () => {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [featuredArticles, setFeaturedArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCategories();
        fetchFeaturedArticles();
    }, []);

    useEffect(() => {
        fetchArticles();
    }, [searchTerm, selectedCategory, currentPage]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/api/articles/categories');
            // ✅ Đảm bảo categories luôn là array
            const data = response.data;
            if (Array.isArray(data)) {
                setCategories(data);
            } else if (data && Array.isArray(data.categories)) {
                setCategories(data.categories);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            setCategories([]);
        }
    };

    const fetchFeaturedArticles = async () => {
        try {
            const response = await api.get('/api/articles/featured');
            // ✅ Đảm bảo featuredArticles luôn là array
            const data = response.data;
            if (Array.isArray(data)) {
                setFeaturedArticles(data);
            } else if (data && Array.isArray(data.articles)) {
                setFeaturedArticles(data.articles);
            } else {
                setFeaturedArticles([]);
            }
        } catch (error) {
            console.error('❌ Error fetching featured articles:', error);
            setFeaturedArticles([]);
        }
    };

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 9
            };

            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.category = selectedCategory;

            const response = await api.get('/api/articles', { params });
            setArticles(response.data.articles || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('❌ Error fetching articles:', error);
            setArticles([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchArticles();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatViews = (views) => {
        if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'k';
        }
        return views;
    };

    const getCategoryColor = (slug) => {
        const colors = {
            'suc-khoe-tong-quat': '#3498db',
            'dinh-duong': '#2ecc71',
            'tin-tuc-phong-kham': '#9b59b6',
            'benh-thuong-gap': '#e74c3c'
        };
        return colors[slug] || '#95a5a6';
    };

    return (
        <div className={styles.newsContainer}>
            {/* Hero Section - Featured Articles */}
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
                                            style={{ backgroundColor: getCategoryColor(featuredArticles[0].category?.slug) }}
                                        >
                                            {featuredArticles[0].category?.name}
                                        </span>
                                        <h2>{featuredArticles[0].title}</h2>
                                        <p>{featuredArticles[0].excerpt}</p>
                                        <div className={styles.articleMeta}>
                                            <span>📅 {formatDate(featuredArticles[0].published_at)}</span>
                                            <span>👁️ {formatViews(featuredArticles[0].views)} lượt xem</span>
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
                                                style={{ backgroundColor: getCategoryColor(article.category?.slug) }}
                                            >
                                                {article.category?.name}
                                            </span>
                                            <h3>{article.title}</h3>
                                            <div className={styles.articleMeta}>
                                                <span>📅 {formatDate(article.published_at)}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Search & Filter Section */}
            <section className={styles.filterSection}>
                <div className={styles.filterContainer}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm bài viết..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button type="submit" className={styles.searchButton}>
                            Tìm kiếm
                        </button>
                    </form>

                    <div className={styles.categoryFilter}>
                        <button
                            className={`${styles.categoryButton} ${!selectedCategory ? styles.active : ''}`}
                            onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                        >
                            Tất cả
                        </button>
                        {Array.isArray(categories) && categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`${styles.categoryButton} ${selectedCategory === cat.slug ? styles.active : ''}`}
                                onClick={() => { setSelectedCategory(cat.slug); setCurrentPage(1); }}
                                style={selectedCategory === cat.slug ? { backgroundColor: getCategoryColor(cat.slug) } : {}}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Articles Grid */}
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
                                                style={{ backgroundColor: getCategoryColor(article.category?.slug) }}
                                            >
                                                {article.category?.name}
                                            </span>
                                        </div>
                                        <div className={styles.articleContent}>
                                            <h3>{article.title}</h3>
                                            <p>{article.excerpt}</p>
                                            <div className={styles.articleFooter}>
                                                <span className={styles.date}>
                                                    📅 {formatDate(article.published_at)}
                                                </span>
                                                <span className={styles.views}>
                                                    👁️ {formatViews(article.views)}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className={styles.paginationButton}
                                    >
                                        ← Trước
                                    </button>

                                    <div className={styles.pageNumbers}>
                                        {[...Array(totalPages)].map((_, index) => (
                                            <button
                                                key={index + 1}
                                                onClick={() => setCurrentPage(index + 1)}
                                                className={`${styles.pageNumber} ${currentPage === index + 1 ? styles.active : ''}`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
};

export default News;
