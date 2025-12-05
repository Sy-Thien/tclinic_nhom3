import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './NewsDetail.module.css';

const NewsDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [popularArticles, setPopularArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticleDetail();
        fetchPopularArticles();
        window.scrollTo(0, 0);
    }, [slug]);

    const fetchArticleDetail = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/articles/${slug}`);
            // API trả về { success: true, data: { article, relatedArticles } }
            const data = response.data.data || response.data;
            setArticle(data.article || null);
            setRelatedArticles(data.relatedArticles || []);
        } catch (error) {
            console.error('❌ Error fetching article:', error);
            if (error.response?.status === 404) {
                navigate('/news');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPopularArticles = async () => {
        try {
            const response = await api.get('/api/articles/popular');
            // API trả về { success: true, data: [...] }
            setPopularArticles(response.data.data || response.data || []);
        } catch (error) {
            console.error('❌ Error fetching popular articles:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    const handlePrint = () => {
        window.print();
    };

    const handleShare = (platform) => {
        const url = window.location.href;
        const title = article?.title || '';

        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Đang tải bài viết...</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className={styles.notFound}>
                <h2>Không tìm thấy bài viết</h2>
                <Link to="/news" className={styles.backButton}>← Quay lại danh sách</Link>
            </div>
        );
    }

    return (
        <div className={styles.newsDetailContainer}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
                <Link to="/">Trang chủ</Link>
                <span>/</span>
                <Link to="/news">Tin tức</Link>
                <span>/</span>
                <Link to={`/news?category=${article.category?.slug}`}>
                    {article.category?.name}
                </Link>
                <span>/</span>
                <span>{article.title}</span>
            </div>

            <div className={styles.contentWrapper}>
                {/* Main Content */}
                <article className={styles.mainContent}>
                    {/* Article Header */}
                    <header className={styles.articleHeader}>
                        <span
                            className={styles.categoryBadge}
                            style={{ backgroundColor: getCategoryColor(article.category?.slug) }}
                        >
                            {article.category?.name}
                        </span>

                        <h1 className={styles.articleTitle}>{article.title}</h1>

                        <div className={styles.articleMeta}>
                            <div className={styles.metaLeft}>
                                <span className={styles.metaItem}>
                                    📅 {formatDate(article.published_at)}
                                </span>
                                <span className={styles.metaItem}>
                                    👁️ {formatViews(article.views)} lượt xem
                                </span>
                                {article.author && (
                                    <span className={styles.metaItem}>
                                        ✍️ {article.author.fullname || 'Admin'}
                                    </span>
                                )}
                            </div>

                            <div className={styles.socialShare}>
                                <button
                                    onClick={() => handleShare('facebook')}
                                    className={styles.shareButton}
                                    title="Chia sẻ lên Facebook"
                                >
                                    📘 Facebook
                                </button>
                                <button
                                    onClick={() => handleShare('twitter')}
                                    className={styles.shareButton}
                                    title="Chia sẻ lên Twitter"
                                >
                                    🐦 Twitter
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className={styles.shareButton}
                                    title="In bài viết"
                                >
                                    🖨️ In
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {article.thumbnail && (
                        <div className={styles.featuredImage}>
                            <img src={article.thumbnail} alt={article.title} />
                        </div>
                    )}

                    {/* Article Excerpt */}
                    {article.excerpt && (
                        <div className={styles.articleExcerpt}>
                            <p>{article.excerpt}</p>
                        </div>
                    )}

                    {/* Article Content */}
                    <div
                        className={styles.articleContent}
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />

                    {/* Article Footer */}
                    <footer className={styles.articleFooter}>
                        <div className={styles.shareAgain}>
                            <p>Chia sẻ bài viết này:</p>
                            <div className={styles.socialShare}>
                                <button onClick={() => handleShare('facebook')} className={styles.shareButton}>
                                    📘 Facebook
                                </button>
                                <button onClick={() => handleShare('twitter')} className={styles.shareButton}>
                                    🐦 Twitter
                                </button>
                                <button onClick={() => handleShare('linkedin')} className={styles.shareButton}>
                                    💼 LinkedIn
                                </button>
                            </div>
                        </div>
                    </footer>

                    {/* Related Articles */}
                    {relatedArticles.length > 0 && (
                        <section className={styles.relatedSection}>
                            <h2>Bài viết liên quan</h2>
                            <div className={styles.relatedGrid}>
                                {relatedArticles.map(related => (
                                    <Link
                                        key={related.id}
                                        to={`/news/${related.slug}`}
                                        className={styles.relatedCard}
                                    >
                                        <img
                                            src={related.thumbnail || 'https://via.placeholder.com/300x180'}
                                            alt={related.title}
                                        />
                                        <div className={styles.relatedContent}>
                                            <h3>{related.title}</h3>
                                            <div className={styles.relatedMeta}>
                                                <span>📅 {formatDate(related.published_at)}</span>
                                                <span>👁️ {formatViews(related.views)}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </article>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    {/* Popular Articles */}
                    {popularArticles.length > 0 && (
                        <div className={styles.sidebarWidget}>
                            <h3 className={styles.widgetTitle}>📊 Bài viết phổ biến</h3>
                            <div className={styles.popularList}>
                                {popularArticles.slice(0, 5).map(popular => (
                                    <Link
                                        key={popular.id}
                                        to={`/news/${popular.slug}`}
                                        className={styles.popularItem}
                                    >
                                        <img
                                            src={popular.thumbnail || 'https://via.placeholder.com/80x60'}
                                            alt={popular.title}
                                        />
                                        <div className={styles.popularInfo}>
                                            <h4>{popular.title}</h4>
                                            <span className={styles.popularViews}>
                                                👁️ {formatViews(popular.views)} lượt xem
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA Widget */}
                    <div className={styles.sidebarWidget}>
                        <div className={styles.ctaWidget}>
                            <h3>💊 Đặt lịch khám ngay</h3>
                            <p>Nhận tư vấn miễn phí từ bác sĩ chuyên khoa</p>
                            <Link to="/dat-kham" className={styles.ctaButton}>
                                Đặt lịch ngay
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default NewsDetail;
