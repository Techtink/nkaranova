import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiSun, FiMoon, FiUser, FiMessageSquare, FiArrowRight, FiStar, FiHeart, FiChevronLeft, FiChevronRight, FiFeather, FiLayers, FiPackage, FiLogOut, FiSettings, FiCalendar, FiEdit3 } from 'react-icons/fi';
import { settingsAPI, tailorsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './Home.scss';

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, isTailor, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [settings, setSettings] = useState({
    landing_hero_image: '',
    landing_hero_title_line1: 'Clean Lines.',
    landing_hero_title_line2: 'Conscious Living.',
    landing_hero_subtitle: 'Timeless essentials for the modern minimalist. Designed to simplify your wardrobe — and elevate your everyday.',
    landing_hero_cta_text: 'Explore the Collection',
    landing_hero_cta_link: '/tailors',
    landing_testimonial_text: 'Timeless, wearable, and truly well made.',
    landing_review_count: 450,
    landing_review_rating: 4.9,
    landing_brand_name: 'AFROTHREAD',
    landing_product_tag_1_name: 'Beige Blazer',
    landing_product_tag_1_price: '80 USD',
    landing_product_tag_2_name: 'Beige Trousers',
    landing_product_tag_2_price: '65 USD',
    landing_featured_tailor: '',
    landing_background_text: 'FASHION',
    landing_background_text_size: 22,
    // Section 2 settings
    landing_section2_title: 'Explore by Categories',
    landing_section2_description: 'Discover curated pieces designed to elevate everyday elegance. Whether you\'re dressing up, keeping it casual, or making a statement — Velora has you covered.',
    landing_section2_stat_1_value: '12,000+',
    landing_section2_stat_1_label: 'Happy customers',
    landing_section2_stat_2_value: '80%',
    landing_section2_stat_2_label: 'Customer return rate',
    landing_section2_stat_3_value: '5000+',
    landing_section2_stat_3_label: 'Five-star reviews',
    landing_section2_stat_4_value: 'Weekly',
    landing_section2_stat_4_label: 'New styles added',
    landing_section2_category_1_name: 'Tops',
    landing_section2_category_1_image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&h=800&fit=crop',
    landing_section2_category_1_link: '/tailors?category=tops',
    landing_section2_category_2_name: 'Bottoms',
    landing_section2_category_2_image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop',
    landing_section2_category_2_link: '/tailors?category=bottoms',
    landing_section2_category_3_name: 'Dresses',
    landing_section2_category_3_image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
    landing_section2_category_3_link: '/tailors?category=dresses',
    landing_section2_category_4_name: 'Accessories',
    landing_section2_category_4_image: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=600&h=800&fit=crop',
    landing_section2_category_4_link: '/tailors?category=accessories',
    // Section 3 - New Arrivals settings
    landing_section3_title: 'New Arrivals',
    landing_section3_product_1_name: 'Organic Colour Cashmere Top',
    landing_section3_product_1_price: '149,00',
    landing_section3_product_1_currency: 'EUR',
    landing_section3_product_1_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    landing_section3_product_1_link: '/tailors',
    landing_section3_product_1_colors: '#D4A574,#8B7355,#2C2C2C,#E8E4DC',
    landing_section3_product_2_name: 'Organic Colour Cashmere Top',
    landing_section3_product_2_price: '149,00',
    landing_section3_product_2_currency: 'EUR',
    landing_section3_product_2_image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop',
    landing_section3_product_2_link: '/tailors',
    landing_section3_product_2_colors: '#D4A574,#8B7355,#2C2C2C,#E8E4DC',
    landing_section3_product_3_name: 'Organic Colour Cashmere Top',
    landing_section3_product_3_price: '149,00',
    landing_section3_product_3_currency: 'EUR',
    landing_section3_product_3_image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop',
    landing_section3_product_3_link: '/tailors',
    landing_section3_product_3_colors: '#D4A574,#8B7355,#2C2C2C,#E8E4DC',
    landing_section3_product_4_name: 'Organic Colour Cashmere Top',
    landing_section3_product_4_price: '149,00',
    landing_section3_product_4_currency: 'EUR',
    landing_section3_product_4_image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=600&fit=crop',
    landing_section3_product_4_link: '/tailors',
    landing_section3_product_4_colors: '#D4A574,#8B7355,#2C2C2C,#E8E4DC',
    // Section 4 - What Makes Us Different settings
    landing_section4_title: 'What Makes Us Different',
    landing_section4_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop',
    landing_section4_feature_1_title: 'Sustainable Fabrics',
    landing_section4_feature_1_description: 'Only organic, recycled, or low-impact materials make the cut.',
    landing_section4_feature_2_title: 'Small Batch Production',
    landing_section4_feature_2_description: 'Crafted in limited runs to reduce waste and ensure quality.',
    landing_section4_feature_3_title: 'Minimal Packaging',
    landing_section4_feature_3_description: 'Shipped in recyclable, plastic-free materials.',
    landing_section4_testimonial_subtitle: 'Loved by Women Everywhere',
    landing_section4_testimonial_text: 'Since switching to Velora, I\'ve never felt more confident. The fabrics, the fit, the details - everything feels intentional.',
    landing_section4_testimonial_author: 'Amanda R.',
    landing_section4_testimonial_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    // Section 5 - Best Sellers settings
    landing_section5_title: 'Best Sellers',
    landing_section5_product_1_name: 'Classic Wool Blend Coat',
    landing_section5_product_1_price: '289,00',
    landing_section5_product_1_currency: 'EUR',
    landing_section5_product_1_image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=600&fit=crop',
    landing_section5_product_1_link: '/tailors',
    landing_section5_product_1_colors: '#1a1a1a,#8B7355,#E8E4DC',
    landing_section5_product_2_name: 'Silk Midi Dress',
    landing_section5_product_2_price: '199,00',
    landing_section5_product_2_currency: 'EUR',
    landing_section5_product_2_image: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=400&h=600&fit=crop',
    landing_section5_product_2_link: '/tailors',
    landing_section5_product_2_colors: '#D4A574,#2C2C2C,#8B7355',
    landing_section5_product_3_name: 'Linen Wide Leg Pants',
    landing_section5_product_3_price: '129,00',
    landing_section5_product_3_currency: 'EUR',
    landing_section5_product_3_image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=600&fit=crop',
    landing_section5_product_3_link: '/tailors',
    landing_section5_product_3_colors: '#E8E4DC,#D4A574,#1a1a1a',
    landing_section5_product_4_name: 'Cashmere Knit Sweater',
    landing_section5_product_4_price: '179,00',
    landing_section5_product_4_currency: 'EUR',
    landing_section5_product_4_image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop',
    landing_section5_product_4_link: '/tailors',
    landing_section5_product_4_colors: '#8B7355,#E8E4DC,#2C2C2C',
    // Section 6 - Newsletter/Community settings
    landing_section6_title_line1: 'Less Inbox Clutter.',
    landing_section6_title_line2: 'More Style Inspiration.',
    landing_section6_subtitle: 'Be the first to know about limited drops, styling tips, and capsule wardrobe ideas.',
    landing_section6_cta_text: 'Join The Community',
    landing_section6_cta_link: '/register',
    landing_section6_image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&h=900&fit=crop'
  });
  const [featuredTailor, setFeaturedTailor] = useState(null);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);
  const bestSellersCarouselRef = useRef(null);

  useEffect(() => {
    fetchLandingSettings();
  }, []);

  // Fetch featured tailor data when settings change
  useEffect(() => {
    if (settings.landing_featured_tailor) {
      fetchFeaturedTailor(settings.landing_featured_tailor);
    }
  }, [settings.landing_featured_tailor]);

  const fetchLandingSettings = async () => {
    try {
      const response = await settingsAPI.getPublicLanding();
      if (response.data.data) {
        setSettings(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.error('Error fetching landing settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedTailor = async (username) => {
    try {
      const response = await tailorsAPI.getByUsername(username);
      if (response.data.data) {
        setFeaturedTailor(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching featured tailor:', error);
    }
  };

  // Get review data - use featured tailor's data if available, otherwise use settings
  const reviewRating = featuredTailor?.averageRating || settings.landing_review_rating;
  const reviewCount = featuredTailor?.reviewCount || settings.landing_review_count;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FiStar key={i} className="star filled" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FiStar key={i} className="star half" />);
      } else {
        stars.push(<FiStar key={i} className="star" />);
      }
    }
    return stars;
  };

  // Carousel scroll functions
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 544; // Card width (520px) + gap (24px)
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollBestSellersCarousel = (direction) => {
    if (bestSellersCarouselRef.current) {
      const scrollAmount = 544; // Card width (520px) + gap (24px)
      bestSellersCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Format price with currency symbol
  const formatPrice = (price, currency) => {
    const symbols = { EUR: '\u20AC', USD: '$', GBP: '\u00A3' };
    return `${symbols[currency] || currency}${price}`;
  };

  // Parse colors string to array
  const parseColors = (colorsString) => {
    return colorsString ? colorsString.split(',').map(c => c.trim()) : [];
  };

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <div className="velora-home">
      {/* Navigation */}
      <nav className="velora-nav">
        <div className="nav-left">
          <Link to="/tailors" className="nav-link arrow-link">Find Tailors</Link>
          <Link to="/gallery" className="nav-link arrow-link">Gallery</Link>
          <Link to="/ai-search" className="nav-link arrow-link">AI Search</Link>
        </div>

        <div className="nav-center">
          <Link to="/" className="brand-logo">{settings.landing_brand_name}</Link>
        </div>

        <div className="nav-right">
          <Link to="/tailors" className="nav-icon-btn" title="Search">
            <FiSearch />
          </Link>
          <button
            className="nav-icon-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
          {isAuthenticated && (
            <Link to="/messages" className="nav-icon-btn" title="Messages">
              <FiMessageSquare />
            </Link>
          )}

          {isAuthenticated ? (
            <div className="profile-dropdown">
              <button
                className="nav-icon-btn profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                title="Account"
              >
                <div className="nav-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.firstName} />
                  ) : (
                    user?.firstName?.charAt(0) || <FiUser />
                  )}
                </div>
              </button>

              {profileOpen && (
                <div className="dropdown-menu" onClick={() => setProfileOpen(false)}>
                  <div className="dropdown-header">
                    <span className="dropdown-name">{user?.firstName} {user?.lastName}</span>
                    <span className="dropdown-email">{user?.email}</span>
                  </div>

                  {isTailor && (
                    <>
                      <Link to="/tailor/dashboard" className="dropdown-item">
                        <FiUser /> Dashboard
                      </Link>
                      <Link to="/tailor/bookings" className="dropdown-item">
                        <FiCalendar /> Bookings
                      </Link>
                    </>
                  )}

                  {isAdmin && (
                    <Link to="/admin" className="dropdown-item">
                      <FiSettings /> Admin Panel
                    </Link>
                  )}

                  {!isTailor && !isAdmin && (
                    <>
                      <Link to="/bookings" className="dropdown-item">
                        <FiCalendar /> My Bookings
                      </Link>
                      <Link to="/orders" className="dropdown-item">
                        <FiPackage /> My Orders
                      </Link>
                      <Link to="/measurements" className="dropdown-item">
                        <FiEdit3 /> My Measurements
                      </Link>
                    </>
                  )}

                  <Link to="/settings" className="dropdown-item">
                    <FiSettings /> Settings
                  </Link>

                  <button onClick={handleLogout} className="dropdown-item dropdown-logout">
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-icon-btn" title="Account">
              <FiUser />
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="velora-hero">
        {/* Background Stripes */}
        <div className="background-stripes">
          <div className="stripe"></div>
          <div className="stripe"></div>
          <div className="stripe"></div>
          <div className="stripe"></div>
          <div className="stripe"></div>
        </div>

        {/* Background Text */}
        <div
          className="background-text"
          style={{ fontSize: `${settings.landing_background_text_size}rem` }}
        >
          {settings.landing_background_text}
        </div>

        <div className="hero-container">
          {/* Left Content */}
          <div className="hero-left">
            <h1 className="hero-title">
              <span className="title-line">{settings.landing_hero_title_line1}</span>
              <span className="title-line">{settings.landing_hero_title_line2}</span>
            </h1>

            <div className="testimonial">
              <div className="quote-marks">
                <span className="quote-mark left">"</span>
                <p className="quote-text">{settings.landing_testimonial_text}</p>
                <span className="quote-mark right">"</span>
              </div>
              <div className="quote-arrow">
                <svg viewBox="0 0 50 30" className="arrow-svg">
                  <path d="M5,25 Q25,5 45,15" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M40,10 L45,15 L38,18" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Center - Model Image */}
          <div className="hero-center">
            {settings.landing_hero_image ? (
              <div className="model-container">
                <img
                  src={settings.landing_hero_image}
                  alt="Fashion model"
                  className="model-image"
                />

                {/* Product Tag 1 */}
                <div className="product-tag tag-1">
                  <div className="tag-dot"></div>
                  <div className="tag-content">
                    <span className="tag-name">{settings.landing_product_tag_1_name}</span>
                    <span className="tag-price">{settings.landing_product_tag_1_price}</span>
                  </div>
                  <div className="tag-arrow">
                    <FiArrowRight />
                  </div>
                </div>

                {/* Product Tag 2 */}
                <div className="product-tag tag-2">
                  <div className="tag-dot"></div>
                  <div className="tag-content">
                    <span className="tag-name">{settings.landing_product_tag_2_name}</span>
                    <span className="tag-price">{settings.landing_product_tag_2_price}</span>
                  </div>
                  <div className="tag-arrow">
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            ) : (
              <div className="model-placeholder">
                <p>Upload a hero image in admin settings</p>
              </div>
            )}
          </div>

          {/* Right Content */}
          <div className="hero-right">
            <p className="hero-subtitle">{settings.landing_hero_subtitle}</p>

            <Link
              to={settings.landing_featured_tailor ? `/tailor/${settings.landing_featured_tailor}` : settings.landing_hero_cta_link}
              className="cta-button"
            >
              {settings.landing_hero_cta_text}
              <FiArrowRight className="cta-arrow" />
            </Link>

            <div className="rating-section">
              <div className="rating-divider"></div>
              <div className="rating-content">
                <div className="stars">
                  {renderStars(reviewRating)}
                </div>
                <div className="rating-text">
                  {reviewRating.toFixed(1)} / {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore by Categories Section */}
      <section className="categories-section">
        <div className="categories-container">
          {/* Header Row */}
          <div className="categories-header">
            <h2 className="categories-title">{settings.landing_section2_title}</h2>
            <div className="categories-description">
              <p>{settings.landing_section2_description}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="categories-stats">
            <div className="stat-item">
              <span className="stat-value">{settings.landing_section2_stat_1_value}</span>
              <span className="stat-label">{settings.landing_section2_stat_1_label}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{settings.landing_section2_stat_2_value}</span>
              <span className="stat-label">{settings.landing_section2_stat_2_label}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{settings.landing_section2_stat_3_value}</span>
              <span className="stat-label">{settings.landing_section2_stat_3_label}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{settings.landing_section2_stat_4_value}</span>
              <span className="stat-label">{settings.landing_section2_stat_4_label}</span>
            </div>
          </div>

          {/* Category Cards */}
          <div className="category-cards">
            <Link to={settings.landing_section2_category_1_link} className="category-card">
              <div className="card-image">
                <img
                  src={settings.landing_section2_category_1_image}
                  alt={settings.landing_section2_category_1_name}
                />
              </div>
              <div className="card-footer">
                <span className="card-name">{settings.landing_section2_category_1_name}</span>
                <span className="card-arrow">
                  <FiArrowRight />
                </span>
              </div>
            </Link>

            <Link to={settings.landing_section2_category_2_link} className="category-card">
              <div className="card-image">
                <img
                  src={settings.landing_section2_category_2_image}
                  alt={settings.landing_section2_category_2_name}
                />
              </div>
              <div className="card-footer">
                <span className="card-name">{settings.landing_section2_category_2_name}</span>
                <span className="card-arrow">
                  <FiArrowRight />
                </span>
              </div>
            </Link>

            <Link to={settings.landing_section2_category_3_link} className="category-card">
              <div className="card-image">
                <img
                  src={settings.landing_section2_category_3_image}
                  alt={settings.landing_section2_category_3_name}
                />
              </div>
              <div className="card-footer">
                <span className="card-name">{settings.landing_section2_category_3_name}</span>
                <span className="card-arrow">
                  <FiArrowRight />
                </span>
              </div>
            </Link>

            <Link to={settings.landing_section2_category_4_link} className="category-card">
              <div className="card-image">
                <img
                  src={settings.landing_section2_category_4_image}
                  alt={settings.landing_section2_category_4_name}
                />
              </div>
              <div className="card-footer">
                <span className="card-name">{settings.landing_section2_category_4_name}</span>
                <span className="card-arrow">
                  <FiArrowRight />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="new-arrivals-section">
        <div className="new-arrivals-container">
          {/* Header */}
          <div className="new-arrivals-header">
            <h2 className="new-arrivals-title">{settings.landing_section3_title}</h2>
            <div className="carousel-nav">
              <button
                className="carousel-btn prev"
                onClick={() => scrollCarousel('left')}
                aria-label="Previous"
              >
                <FiChevronLeft />
              </button>
              <button
                className="carousel-btn next"
                onClick={() => scrollCarousel('right')}
                aria-label="Next"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>

          {/* Product Carousel */}
          <div className="products-carousel" ref={carouselRef}>
            {[1, 2, 3, 4].map((num) => (
              <Link
                key={num}
                to={settings[`landing_section3_product_${num}_link`]}
                className="product-card"
              >
                <div className="product-image-wrapper">
                  <img
                    src={settings[`landing_section3_product_${num}_image`]}
                    alt={settings[`landing_section3_product_${num}_name`]}
                    className="product-image"
                  />
                  <div className="new-badge">
                    <span className="bracket-left"></span>
                    <span className="badge-text">New</span>
                    <span className="bracket-right"></span>
                  </div>
                  <button
                    className="favorite-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle favorite
                    }}
                  >
                    <FiHeart />
                  </button>
                </div>
                <div className="product-info">
                  <div className="color-swatches">
                    {parseColors(settings[`landing_section3_product_${num}_colors`]).map((color, idx) => (
                      <span
                        key={idx}
                        className="color-swatch"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <h3 className="product-name">{settings[`landing_section3_product_${num}_name`]}</h3>
                  <p className="product-price">
                    {formatPrice(
                      settings[`landing_section3_product_${num}_price`],
                      settings[`landing_section3_product_${num}_currency`]
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different Section */}
      <section className="difference-section">
        <div className="difference-container">
          {/* Left - Large Image */}
          <div className="difference-image">
            <img
              src={settings.landing_section4_image}
              alt="What makes us different"
            />
          </div>

          {/* Right - Content */}
          <div className="difference-content">
            <h2 className="difference-title">{settings.landing_section4_title}</h2>

            {/* Features */}
            <div className="difference-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <FiFeather />
                </div>
                <div className="feature-text">
                  <h3>{settings.landing_section4_feature_1_title}</h3>
                  <p>{settings.landing_section4_feature_1_description}</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <FiLayers />
                </div>
                <div className="feature-text">
                  <h3>{settings.landing_section4_feature_2_title}</h3>
                  <p>{settings.landing_section4_feature_2_description}</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <FiPackage />
                </div>
                <div className="feature-text">
                  <h3>{settings.landing_section4_feature_3_title}</h3>
                  <p>{settings.landing_section4_feature_3_description}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="difference-divider"></div>

            {/* Testimonial */}
            <div className="difference-testimonial">
              <h4 className="testimonial-subtitle">{settings.landing_section4_testimonial_subtitle}</h4>
              <blockquote className="testimonial-quote">
                "{settings.landing_section4_testimonial_text}"
              </blockquote>
              <div className="testimonial-author">
                {settings.landing_section4_testimonial_image && (
                  <img
                    src={settings.landing_section4_testimonial_image}
                    alt={settings.landing_section4_testimonial_author}
                    className="author-image"
                  />
                )}
                <span className="author-name">{settings.landing_section4_testimonial_author}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="best-sellers-section">
        <div className="best-sellers-container">
          {/* Header */}
          <div className="best-sellers-header">
            <h2 className="best-sellers-title">{settings.landing_section5_title}</h2>
            <div className="carousel-nav">
              <button
                className="carousel-btn prev"
                onClick={() => scrollBestSellersCarousel('left')}
                aria-label="Previous"
              >
                <FiChevronLeft />
              </button>
              <button
                className="carousel-btn next"
                onClick={() => scrollBestSellersCarousel('right')}
                aria-label="Next"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>

          {/* Product Carousel */}
          <div className="products-carousel" ref={bestSellersCarouselRef}>
            {[1, 2, 3, 4].map((num) => (
              <Link
                key={num}
                to={settings[`landing_section5_product_${num}_link`]}
                className="product-card"
              >
                <div className="product-image-wrapper">
                  <img
                    src={settings[`landing_section5_product_${num}_image`]}
                    alt={settings[`landing_section5_product_${num}_name`]}
                    className="product-image"
                  />
                  <div className="bestseller-badge">
                    <span className="bracket-left"></span>
                    <span className="badge-text">Best Seller</span>
                    <span className="bracket-right"></span>
                  </div>
                  <button
                    className="favorite-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle favorite
                    }}
                  >
                    <FiHeart />
                  </button>
                </div>
                <div className="product-info">
                  <div className="color-swatches">
                    {parseColors(settings[`landing_section5_product_${num}_colors`]).map((color, idx) => (
                      <span
                        key={idx}
                        className="color-swatch"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <h3 className="product-name">{settings[`landing_section5_product_${num}_name`]}</h3>
                  <p className="product-price">
                    {formatPrice(
                      settings[`landing_section5_product_${num}_price`],
                      settings[`landing_section5_product_${num}_currency`]
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter/Community Section */}
      <section className="newsletter-section">
        <div
          className="newsletter-background"
          style={{ backgroundImage: `url(${settings.landing_section6_image})` }}
        >
          <div className="newsletter-overlay"></div>
          <div className="newsletter-content">
            <h2 className="newsletter-title">
              <span className="title-line">{settings.landing_section6_title_line1}</span>
              <span className="title-line">{settings.landing_section6_title_line2}</span>
            </h2>
            <p className="newsletter-subtitle">{settings.landing_section6_subtitle}</p>
            <Link to={settings.landing_section6_cta_link} className="newsletter-cta">
              {settings.landing_section6_cta_text}
              <FiArrowRight className="cta-arrow" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
