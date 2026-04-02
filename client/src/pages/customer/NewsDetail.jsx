import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './NewsDetail.module.css';

class NewsDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            article: null,
            relatedArticles: [],
            popularArticles: [],
            loading: true
        };
    }

    componentDidMount() {
        this.fetchArticleDetail();
        this.fetchPopularArticles();
        window.scrollTo(0, 0);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.params.slug !== this.props.params.slug) {
            this.fetchArticleDetail();
            this.fetchPopularArticles();
            window.scrollTo(0, 0);
        }
    }

    fetchArticleDetail = async () => {
        const { slug } = this.props.params;
        this.setState({ loading: true });
        try {
            const response = await api.get(`/api/public/articles/${slug}`);
            const data = response.data.data || response.data;
            this.setState({
                article: data.article || null,
                relatedArticles: data.relatedArticles || []
            });
        } catch (error) {
            console.error('❌ Error fetching article:', error);
            if (error.response?.status === 404) {
                this.props.navigate('/news');
            }
        } finally {
            this.setState({ loading: false });
        }
    };

    fetchPopularArticles = async () => {
        try {
            const response = await api.get('/api/public/articles/popular');
            this.setState({ popularArticles: response.data.data || response.data || [] });
        } catch (error) {
            console.error('❌ Error fetching popular articles:', error);
        }
    };

    formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    handlePrint = () => {
        window.print();
    };

    handleShare = (platform) => {
        const { article } = this.state;
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

    render() {
        const { article, relatedArticles, popularArticles, loading } = this.state;

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
                    <article className={styles.mainContent}>
                        <header className={styles.articleHeader}>
                            <span
                                className={styles.categoryBadge}
                                style={{ backgroundColor: this.getCategoryColor(article.category?.slug) }}
                            >
                                {article.category?.name}
                            </span>

                            <h1 className={styles.articleTitle}>{article.title}</h1>

                            <div className={styles.articleMeta}>
                                <div className={styles.metaLeft}>
                                    <span className={styles.metaItem}>
                                        📅 {this.formatDate(article.published_at)}
                                    </span>
                                    <span className={styles.metaItem}>
                                        👁️ {this.formatViews(article.views)} lượt xem
                                    </span>
                                    {article.author && (
                                        <span className={styles.metaItem}>
                                            ✍️ {article.author.fullname || 'Admin'}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.socialShare}>
                                    <button
                                        onClick={() => this.handleShare('facebook')}
                                        className={styles.shareButton}
                                        title="Chia sẻ lên Facebook"
                                    >
                                        📘 Facebook
                                    </button>
                                    <button
                                        onClick={() => this.handleShare('twitter')}
                                        className={styles.shareButton}
                                        title="Chia sẻ lên Twitter"
                                    >
                                        🐦 Twitter
                                    </button>
                                    <button
                                        onClick={this.handlePrint}
                                        className={styles.shareButton}
                                        title="In bài viết"
                                    >
                                        🖨️ In
                                    </button>
                                </div>
                            </div>
                        </header>

                        {article.thumbnail && (
                            <div className={styles.featuredImage}>
                                <img src={article.thumbnail} alt={article.title} />
                            </div>
                        )}

                        {article.excerpt && (
                            <div className={styles.articleExcerpt}>
                                <p>{article.excerpt}</p>
                            </div>
                        )}

                        <div
                            className={styles.articleContent}
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        <footer className={styles.articleFooter}>
                            <div className={styles.shareAgain}>
                                <p>Chia sẻ bài viết này:</p>
                                <div className={styles.socialShare}>
                                    <button onClick={() => this.handleShare('facebook')} className={styles.shareButton}>
                                        📘 Facebook
                                    </button>
                                    <button onClick={() => this.handleShare('twitter')} className={styles.shareButton}>
                                        🐦 Twitter
                                    </button>
                                    <button onClick={() => this.handleShare('linkedin')} className={styles.shareButton}>
                                        💼 LinkedIn
                                    </button>
                                </div>
                            </div>
                        </footer>

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
                                                    <span>📅 {this.formatDate(related.published_at)}</span>
                                                    <span>👁️ {this.formatViews(related.views)}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </article>

                    <aside className={styles.sidebar}>
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
                                                    👁️ {this.formatViews(popular.views)} lượt xem
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

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
    }
}

export default withRouter(NewsDetail);
