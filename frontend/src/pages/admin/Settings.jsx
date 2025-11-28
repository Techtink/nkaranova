import { useState, useEffect, useRef } from 'react';
import { FiSave, FiRefreshCw, FiDollarSign, FiUsers, FiStar, FiSettings, FiImage, FiUpload, FiX, FiSmartphone } from 'react-icons/fi';
import { settingsAPI } from '../../services/api';
import './Admin.scss';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('referral');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      // Convert settings object to flat key-value pairs
      const flatSettings = {};
      Object.entries(response.data.data).forEach(([key, data]) => {
        flatSettings[key] = data.value;
      });
      setSettings(flatSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateMultiple(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await settingsAPI.uploadHeroImage(file);
      if (response.data.success) {
        handleChange('landing_hero_image', response.data.data.url);
        alert('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    handleChange('landing_hero_image', '');
  };

  const formatCurrency = (cents) => {
    return (cents / 100).toFixed(2);
  };

  const parseCurrency = (dollars) => {
    return Math.round(parseFloat(dollars) * 100);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-page page">
      <div className="container">
        {/* ERP Page Header */}
        <div className="erp-page-header">
          <div className="header-top">
            <div className="header-left">
              <div className="header-icon">
                <FiSettings />
              </div>
              <div className="header-text">
                <h1>Platform Settings</h1>
                <p>Configure referral system, featured spots, pricing, and landing page</p>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="btn-erp btn-erp-secondary"
                onClick={fetchSettings}
                disabled={saving}
              >
                <FiRefreshCw />
                Reset
              </button>
              <button
                className="btn-erp btn-erp-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="spinner-small" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="header-line" />
        </div>

        {/* ERP Tabs */}
        <div className="erp-tabs">
          <button
            className={`erp-tab ${activeTab === 'referral' ? 'active' : ''}`}
            onClick={() => setActiveTab('referral')}
          >
            <FiUsers />
            Referral System
          </button>
          <button
            className={`erp-tab ${activeTab === 'featured' ? 'active' : ''}`}
            onClick={() => setActiveTab('featured')}
          >
            <FiStar />
            Featured Spots
          </button>
          <button
            className={`erp-tab ${activeTab === 'landing' ? 'active' : ''}`}
            onClick={() => setActiveTab('landing')}
          >
            <FiImage />
            Landing Page
          </button>
          <button
            className={`erp-tab ${activeTab === 'mobile' ? 'active' : ''}`}
            onClick={() => setActiveTab('mobile')}
          >
            <FiSmartphone />
            Mobile App
          </button>
        </div>

        {/* Content */}
        <div className="erp-card">
          <div className="card-body">
            {activeTab === 'referral' && (
              <div className="settings-section">
                <h3>Referral System Settings</h3>
                <p className="section-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                  Configure how the referral program works for tailors
                </p>

                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="setting-item">
                      <label>Tokens Per Referral</label>
                      <p className="setting-description">Number of tokens awarded when a referred tailor is verified</p>
                      <input
                        type="number"
                        value={settings.tokens_per_referral || 10}
                        onChange={(e) => handleChange('tokens_per_referral', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="setting-item">
                      <label>Tokens Required for Featured Spot</label>
                      <p className="setting-description">Tokens needed to redeem a featured placement</p>
                      <input
                        type="number"
                        value={settings.tokens_for_featured_spot || 100}
                        onChange={(e) => handleChange('tokens_for_featured_spot', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="setting-item">
                      <label>Referral Requires Verification</label>
                      <p className="setting-description">Only count referrals when the new tailor is verified</p>
                      <select
                        value={settings.referral_requires_verification ? 'true' : 'false'}
                        onChange={(e) => handleChange('referral_requires_verification', e.target.value === 'true')}
                      >
                        <option value="true">Yes - Must be verified</option>
                        <option value="false">No - Count on registration</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="setting-item">
                      <label>Referrals Needed for Featured Spot</label>
                      <p className="setting-description">Calculated: tokens required / tokens per referral</p>
                      <div className="erp-badge badge-primary" style={{ fontSize: '16px', padding: '12px 16px' }}>
                        {Math.ceil((settings.tokens_for_featured_spot || 100) / (settings.tokens_per_referral || 10))} referrals
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'featured' && (
              <div className="settings-section">
                <h3>Featured Spot Settings</h3>
                <p className="section-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                  Configure featured placement duration and pricing
                </p>

                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="setting-item">
                      <label>Token Redemption Duration (Days)</label>
                      <p className="setting-description">How long a featured spot lasts when redeemed with tokens</p>
                      <input
                        type="number"
                        value={settings.featured_spot_duration_days || 7}
                        onChange={(e) => handleChange('featured_spot_duration_days', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="setting-item">
                      <label>Maximum Featured Tailors</label>
                      <p className="setting-description">Maximum number of tailors shown in featured section</p>
                      <input
                        type="number"
                        value={settings.max_featured_tailors || 8}
                        onChange={(e) => handleChange('max_featured_tailors', parseInt(e.target.value))}
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiDollarSign />
                    Paid Featured Spot Pricing
                  </h3>

                  <div className="row g-4" style={{ marginTop: '16px' }}>
                    <div className="col-md-4">
                      <div className="setting-item">
                        <label>7 Days</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '600' }}>$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formatCurrency(settings.featured_spot_price_7_days || 2900)}
                            onChange={(e) => handleChange('featured_spot_price_7_days', parseCurrency(e.target.value))}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="setting-item">
                        <label>14 Days</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '600' }}>$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formatCurrency(settings.featured_spot_price_14_days || 4900)}
                            onChange={(e) => handleChange('featured_spot_price_14_days', parseCurrency(e.target.value))}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="setting-item">
                        <label>30 Days</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '600' }}>$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formatCurrency(settings.featured_spot_price_30_days || 8900)}
                            onChange={(e) => handleChange('featured_spot_price_30_days', parseCurrency(e.target.value))}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'landing' && (
              <div className="settings-section">
                <h3>Landing Page Settings</h3>
                <p className="section-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                  Customize your landing page hero section
                </p>

                {/* Hero Image Upload */}
                <div className="setting-item" style={{ marginBottom: '32px' }}>
                  <label>Hero Image</label>
                  <p className="setting-description">Upload the main hero image (recommended: transparent PNG, 800x1000px)</p>

                  <div className="hero-image-upload">
                    {settings.landing_hero_image ? (
                      <div className="image-preview">
                        <img src={settings.landing_hero_image} alt="Hero preview" />
                        <button
                          className="remove-image-btn"
                          onClick={handleRemoveImage}
                          type="button"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="upload-placeholder"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FiUpload size={32} />
                        <p>Click to upload hero image</p>
                        <span>PNG, JPG, WebP (max 5MB)</span>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />

                    {settings.landing_hero_image && (
                      <button
                        className="btn-erp btn-erp-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{ marginTop: '12px' }}
                      >
                        {uploading ? 'Uploading...' : 'Change Image'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Brand & Title</h4>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Brand Name</label>
                        <p className="setting-description">Displayed in the navigation</p>
                        <input
                          type="text"
                          value={settings.landing_brand_name || 'VELORA'}
                          onChange={(e) => handleChange('landing_brand_name', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="setting-item">
                        <label>Background Text</label>
                        <p className="setting-description">Large watermark text in hero</p>
                        <input
                          type="text"
                          value={settings.landing_background_text || 'FASHION'}
                          onChange={(e) => handleChange('landing_background_text', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-2">
                      <div className="setting-item">
                        <label>Font Size (rem)</label>
                        <p className="setting-description">Text size</p>
                        <input
                          type="number"
                          step="1"
                          min="10"
                          max="40"
                          value={settings.landing_background_text_size || 22}
                          onChange={(e) => handleChange('landing_background_text_size', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Title Line 1</label>
                        <p className="setting-description">First line of the main headline</p>
                        <input
                          type="text"
                          value={settings.landing_hero_title_line1 || 'Clean Lines.'}
                          onChange={(e) => handleChange('landing_hero_title_line1', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Title Line 2</label>
                        <p className="setting-description">Second line of the main headline</p>
                        <input
                          type="text"
                          value={settings.landing_hero_title_line2 || 'Conscious Living.'}
                          onChange={(e) => handleChange('landing_hero_title_line2', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="setting-item">
                        <label>Subtitle</label>
                        <p className="setting-description">Description text below the CTA button</p>
                        <textarea
                          value={settings.landing_hero_subtitle || ''}
                          onChange={(e) => handleChange('landing_hero_subtitle', e.target.value)}
                          rows={3}
                          style={{ width: '100%', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Call to Action</h4>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>CTA Button Text</label>
                        <p className="setting-description">Text on the main button</p>
                        <input
                          type="text"
                          value={settings.landing_hero_cta_text || 'Explore the Collection'}
                          onChange={(e) => handleChange('landing_hero_cta_text', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>CTA Button Link</label>
                        <p className="setting-description">Where the button links to</p>
                        <input
                          type="text"
                          value={settings.landing_hero_cta_link || '/tailors'}
                          onChange={(e) => handleChange('landing_hero_cta_link', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Testimonial & Rating</h4>
                  <div className="row g-4">
                    <div className="col-12">
                      <div className="setting-item">
                        <label>Testimonial Quote</label>
                        <p className="setting-description">Customer testimonial text</p>
                        <input
                          type="text"
                          value={settings.landing_testimonial_text || ''}
                          onChange={(e) => handleChange('landing_testimonial_text', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Review Rating</label>
                        <p className="setting-description">Star rating to display (e.g., 4.9)</p>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={settings.landing_review_rating || 4.9}
                          onChange={(e) => handleChange('landing_review_rating', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Review Count</label>
                        <p className="setting-description">Number of reviews to display</p>
                        <input
                          type="number"
                          min="0"
                          value={settings.landing_review_count || 450}
                          onChange={(e) => handleChange('landing_review_count', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Product Tags</h4>
                  <p className="setting-description" style={{ marginBottom: '16px' }}>
                    These tags appear overlaid on the hero image
                  </p>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Product 1 Name</label>
                        <input
                          type="text"
                          value={settings.landing_product_tag_1_name || 'Beige Blazer'}
                          onChange={(e) => handleChange('landing_product_tag_1_name', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Product 1 Price</label>
                        <input
                          type="text"
                          value={settings.landing_product_tag_1_price || '80 USD'}
                          onChange={(e) => handleChange('landing_product_tag_1_price', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Product 2 Name</label>
                        <input
                          type="text"
                          value={settings.landing_product_tag_2_name || 'Beige Trousers'}
                          onChange={(e) => handleChange('landing_product_tag_2_name', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Product 2 Price</label>
                        <input
                          type="text"
                          value={settings.landing_product_tag_2_price || '65 USD'}
                          onChange={(e) => handleChange('landing_product_tag_2_price', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Featured Tailor</h4>
                  <p className="setting-description" style={{ marginBottom: '16px' }}>
                    The tailor whose profile the "Explore the Collection" button links to
                  </p>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Featured Tailor Username</label>
                        <p className="setting-description">Enter the username of the tailor who paid for homepage placement</p>
                        <input
                          type="text"
                          value={settings.landing_featured_tailor || ''}
                          onChange={(e) => handleChange('landing_featured_tailor', e.target.value)}
                          placeholder="e.g., johndoe"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2 - Categories Section */}
                <div style={{ borderTop: '3px solid var(--primary)', paddingTop: '32px', marginTop: '32px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Section 2: Explore by Categories</h3>
                  <p className="setting-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Customize the categories section below the hero
                  </p>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Section Title</label>
                        <input
                          type="text"
                          value={settings.landing_section2_title || 'Explore by Categories'}
                          onChange={(e) => handleChange('landing_section2_title', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="setting-item">
                        <label>Section Description</label>
                        <textarea
                          value={settings.landing_section2_description || ''}
                          onChange={(e) => handleChange('landing_section2_description', e.target.value)}
                          rows={3}
                          style={{ width: '100%', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Stats Row</h4>
                  <div className="row g-4">
                    <div className="col-md-3">
                      <div className="setting-item">
                        <label>Stat 1 Value</label>
                        <input
                          type="text"
                          value={settings.landing_section2_stat_1_value || '12,000+'}
                          onChange={(e) => handleChange('landing_section2_stat_1_value', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="setting-item">
                        <label>Stat 1 Label</label>
                        <input
                          type="text"
                          value={settings.landing_section2_stat_1_label || 'Happy customers'}
                          onChange={(e) => handleChange('landing_section2_stat_1_label', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="setting-item">
                        <label>Stat 2 Value</label>
                        <input
                          type="text"
                          value={settings.landing_section2_stat_2_value || '80%'}
                          onChange={(e) => handleChange('landing_section2_stat_2_value', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="setting-item">
                        <label>Stat 2 Label</label>
                        <input
                          type="text"
                          value={settings.landing_section2_stat_2_label || 'Customer return rate'}
                          onChange={(e) => handleChange('landing_section2_stat_2_label', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="setting-item">
                        <label>Stat 3 Value</label>
                        <input
                          type="text"
                          value={settings.landing_section2_stat_3_value || '5000+'}
                          onChange={(e) => handleChange('landing_section2_stat_3_value', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="setting-item">
                        <label>Stat 3 Label</label>
                        <input
                          type="text"
                          value={settings.landing_section2_stat_3_label || 'Five-star reviews'}
                          onChange={(e) => handleChange('landing_section2_stat_3_label', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="setting-item">
                        <label>Stat 4 Value</label>
                        <input
                          type="text"
                          value={settings.landing_section2_stat_4_value || 'Weekly'}
                          onChange={(e) => handleChange('landing_section2_stat_4_value', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="setting-item">
                        <label>Stat 4 Label</label>
                        <input
                          type="text"
                          value={settings.landing_section2_stat_4_label || 'New styles added'}
                          onChange={(e) => handleChange('landing_section2_stat_4_label', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Cards */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Category Cards</h4>

                  {/* Category 1 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Category 1</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Name</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_1_name || 'Tops'}
                            onChange={(e) => handleChange('landing_section2_category_1_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_1_image || ''}
                            onChange={(e) => handleChange('landing_section2_category_1_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Link</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_1_link || '/tailors?category=tops'}
                            onChange={(e) => handleChange('landing_section2_category_1_link', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category 2 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Category 2</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Name</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_2_name || 'Bottoms'}
                            onChange={(e) => handleChange('landing_section2_category_2_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_2_image || ''}
                            onChange={(e) => handleChange('landing_section2_category_2_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Link</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_2_link || '/tailors?category=bottoms'}
                            onChange={(e) => handleChange('landing_section2_category_2_link', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category 3 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Category 3</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Name</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_3_name || 'Dresses'}
                            onChange={(e) => handleChange('landing_section2_category_3_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_3_image || ''}
                            onChange={(e) => handleChange('landing_section2_category_3_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Link</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_3_link || '/tailors?category=dresses'}
                            onChange={(e) => handleChange('landing_section2_category_3_link', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category 4 */}
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Category 4</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Name</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_4_name || 'Accessories'}
                            onChange={(e) => handleChange('landing_section2_category_4_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_4_image || ''}
                            onChange={(e) => handleChange('landing_section2_category_4_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Link</label>
                          <input
                            type="text"
                            value={settings.landing_section2_category_4_link || '/tailors?category=accessories'}
                            onChange={(e) => handleChange('landing_section2_category_4_link', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3 - New Arrivals */}
                <div style={{ borderTop: '3px solid var(--primary)', paddingTop: '32px', marginTop: '32px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Section 3: New Arrivals</h3>
                  <p className="setting-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Customize the new arrivals product carousel
                  </p>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Section Title</label>
                        <input
                          type="text"
                          value={settings.landing_section3_title || 'New Arrivals'}
                          onChange={(e) => handleChange('landing_section3_title', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Cards */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Product Cards</h4>

                  {/* Product 1 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Product 1</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Name</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_1_name || ''}
                            onChange={(e) => handleChange('landing_section3_product_1_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="setting-item">
                          <label>Price</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_1_price || ''}
                            onChange={(e) => handleChange('landing_section3_product_1_price', e.target.value)}
                            placeholder="149,00"
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="setting-item">
                          <label>Currency</label>
                          <select
                            value={settings.landing_section3_product_1_currency || 'EUR'}
                            onChange={(e) => handleChange('landing_section3_product_1_currency', e.target.value)}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_1_image || ''}
                            onChange={(e) => handleChange('landing_section3_product_1_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Link</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_1_link || '/tailors'}
                            onChange={(e) => handleChange('landing_section3_product_1_link', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Color Swatches (comma-separated hex)</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_1_colors || ''}
                            onChange={(e) => handleChange('landing_section3_product_1_colors', e.target.value)}
                            placeholder="#D4A574,#8B7355,#2C2C2C,#E8E4DC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product 2 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Product 2</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Name</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_2_name || ''}
                            onChange={(e) => handleChange('landing_section3_product_2_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="setting-item">
                          <label>Price</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_2_price || ''}
                            onChange={(e) => handleChange('landing_section3_product_2_price', e.target.value)}
                            placeholder="149,00"
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="setting-item">
                          <label>Currency</label>
                          <select
                            value={settings.landing_section3_product_2_currency || 'EUR'}
                            onChange={(e) => handleChange('landing_section3_product_2_currency', e.target.value)}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_2_image || ''}
                            onChange={(e) => handleChange('landing_section3_product_2_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Link</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_2_link || '/tailors'}
                            onChange={(e) => handleChange('landing_section3_product_2_link', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Color Swatches (comma-separated hex)</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_2_colors || ''}
                            onChange={(e) => handleChange('landing_section3_product_2_colors', e.target.value)}
                            placeholder="#D4A574,#8B7355,#2C2C2C,#E8E4DC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product 3 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Product 3</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Name</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_3_name || ''}
                            onChange={(e) => handleChange('landing_section3_product_3_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="setting-item">
                          <label>Price</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_3_price || ''}
                            onChange={(e) => handleChange('landing_section3_product_3_price', e.target.value)}
                            placeholder="149,00"
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="setting-item">
                          <label>Currency</label>
                          <select
                            value={settings.landing_section3_product_3_currency || 'EUR'}
                            onChange={(e) => handleChange('landing_section3_product_3_currency', e.target.value)}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_3_image || ''}
                            onChange={(e) => handleChange('landing_section3_product_3_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Link</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_3_link || '/tailors'}
                            onChange={(e) => handleChange('landing_section3_product_3_link', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Color Swatches (comma-separated hex)</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_3_colors || ''}
                            onChange={(e) => handleChange('landing_section3_product_3_colors', e.target.value)}
                            placeholder="#D4A574,#8B7355,#2C2C2C,#E8E4DC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product 4 */}
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Product 4</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Name</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_4_name || ''}
                            onChange={(e) => handleChange('landing_section3_product_4_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="setting-item">
                          <label>Price</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_4_price || ''}
                            onChange={(e) => handleChange('landing_section3_product_4_price', e.target.value)}
                            placeholder="149,00"
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="setting-item">
                          <label>Currency</label>
                          <select
                            value={settings.landing_section3_product_4_currency || 'EUR'}
                            onChange={(e) => handleChange('landing_section3_product_4_currency', e.target.value)}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_4_image || ''}
                            onChange={(e) => handleChange('landing_section3_product_4_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Link</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_4_link || '/tailors'}
                            onChange={(e) => handleChange('landing_section3_product_4_link', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Color Swatches (comma-separated hex)</label>
                          <input
                            type="text"
                            value={settings.landing_section3_product_4_colors || ''}
                            onChange={(e) => handleChange('landing_section3_product_4_colors', e.target.value)}
                            placeholder="#D4A574,#8B7355,#2C2C2C,#E8E4DC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4 - What Makes Us Different */}
                <div style={{ borderTop: '3px solid var(--primary)', paddingTop: '32px', marginTop: '32px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Section 4: What Makes Us Different</h3>
                  <p className="setting-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Customize the features and testimonial section
                  </p>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Section Title</label>
                        <input
                          type="text"
                          value={settings.landing_section4_title || 'What Makes Us Different'}
                          onChange={(e) => handleChange('landing_section4_title', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Section Image URL</label>
                        <input
                          type="text"
                          value={settings.landing_section4_image || ''}
                          onChange={(e) => handleChange('landing_section4_image', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Features</h4>

                  {/* Feature 1 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Feature 1</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Title</label>
                          <input
                            type="text"
                            value={settings.landing_section4_feature_1_title || 'Sustainable Fabrics'}
                            onChange={(e) => handleChange('landing_section4_feature_1_title', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className="setting-item">
                          <label>Description</label>
                          <input
                            type="text"
                            value={settings.landing_section4_feature_1_description || ''}
                            onChange={(e) => handleChange('landing_section4_feature_1_description', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Feature 2</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Title</label>
                          <input
                            type="text"
                            value={settings.landing_section4_feature_2_title || 'Small Batch Production'}
                            onChange={(e) => handleChange('landing_section4_feature_2_title', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className="setting-item">
                          <label>Description</label>
                          <input
                            type="text"
                            value={settings.landing_section4_feature_2_description || ''}
                            onChange={(e) => handleChange('landing_section4_feature_2_description', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Feature 3</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="setting-item">
                          <label>Title</label>
                          <input
                            type="text"
                            value={settings.landing_section4_feature_3_title || 'Minimal Packaging'}
                            onChange={(e) => handleChange('landing_section4_feature_3_title', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className="setting-item">
                          <label>Description</label>
                          <input
                            type="text"
                            value={settings.landing_section4_feature_3_description || ''}
                            onChange={(e) => handleChange('landing_section4_feature_3_description', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonial */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Testimonial</h4>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Subtitle</label>
                        <p className="setting-description">Small heading above the testimonial</p>
                        <input
                          type="text"
                          value={settings.landing_section4_testimonial_subtitle || 'Loved by Women Everywhere'}
                          onChange={(e) => handleChange('landing_section4_testimonial_subtitle', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="setting-item">
                        <label>Testimonial Quote</label>
                        <textarea
                          value={settings.landing_section4_testimonial_text || ''}
                          onChange={(e) => handleChange('landing_section4_testimonial_text', e.target.value)}
                          rows={3}
                          style={{ width: '100%', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Author Name</label>
                        <input
                          type="text"
                          value={settings.landing_section4_testimonial_author || 'Amanda R.'}
                          onChange={(e) => handleChange('landing_section4_testimonial_author', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Author Image URL</label>
                        <input
                          type="text"
                          value={settings.landing_section4_testimonial_image || ''}
                          onChange={(e) => handleChange('landing_section4_testimonial_image', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5 - Best Sellers */}
                <div style={{ borderTop: '3px solid var(--primary)', paddingTop: '32px', marginTop: '32px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Section 5: Best Sellers</h3>
                  <p className="setting-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Customize the best sellers product carousel
                  </p>

                  <div className="row g-4">
                    <div className="col-12">
                      <div className="setting-item">
                        <label>Section Title</label>
                        <input
                          type="text"
                          value={settings.landing_section5_title || 'Best Sellers'}
                          onChange={(e) => handleChange('landing_section5_title', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best Sellers Products */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Products</h4>

                  {/* Product 1 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Product 1</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Product Name</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_1_name || ''}
                            onChange={(e) => handleChange('landing_section5_product_1_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="setting-item">
                          <label>Price</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_1_price || ''}
                            onChange={(e) => handleChange('landing_section5_product_1_price', e.target.value)}
                            placeholder="149,00"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="setting-item">
                          <label>Currency</label>
                          <select
                            value={settings.landing_section5_product_1_currency || 'EUR'}
                            onChange={(e) => handleChange('landing_section5_product_1_currency', e.target.value)}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_1_image || ''}
                            onChange={(e) => handleChange('landing_section5_product_1_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Link URL</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_1_link || ''}
                            onChange={(e) => handleChange('landing_section5_product_1_link', e.target.value)}
                            placeholder="/tailors"
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="setting-item">
                          <label>Color Swatches</label>
                          <p className="setting-description">Comma-separated hex colors (e.g., #D4A574,#8B7355,#2C2C2C)</p>
                          <input
                            type="text"
                            value={settings.landing_section5_product_1_colors || ''}
                            onChange={(e) => handleChange('landing_section5_product_1_colors', e.target.value)}
                            placeholder="#D4A574,#8B7355,#2C2C2C,#E8E4DC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product 2 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Product 2</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Product Name</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_2_name || ''}
                            onChange={(e) => handleChange('landing_section5_product_2_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="setting-item">
                          <label>Price</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_2_price || ''}
                            onChange={(e) => handleChange('landing_section5_product_2_price', e.target.value)}
                            placeholder="149,00"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="setting-item">
                          <label>Currency</label>
                          <select
                            value={settings.landing_section5_product_2_currency || 'EUR'}
                            onChange={(e) => handleChange('landing_section5_product_2_currency', e.target.value)}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_2_image || ''}
                            onChange={(e) => handleChange('landing_section5_product_2_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Link URL</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_2_link || ''}
                            onChange={(e) => handleChange('landing_section5_product_2_link', e.target.value)}
                            placeholder="/tailors"
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="setting-item">
                          <label>Color Swatches</label>
                          <p className="setting-description">Comma-separated hex colors (e.g., #D4A574,#8B7355,#2C2C2C)</p>
                          <input
                            type="text"
                            value={settings.landing_section5_product_2_colors || ''}
                            onChange={(e) => handleChange('landing_section5_product_2_colors', e.target.value)}
                            placeholder="#D4A574,#8B7355,#2C2C2C,#E8E4DC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product 3 */}
                  <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Product 3</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Product Name</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_3_name || ''}
                            onChange={(e) => handleChange('landing_section5_product_3_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="setting-item">
                          <label>Price</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_3_price || ''}
                            onChange={(e) => handleChange('landing_section5_product_3_price', e.target.value)}
                            placeholder="149,00"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="setting-item">
                          <label>Currency</label>
                          <select
                            value={settings.landing_section5_product_3_currency || 'EUR'}
                            onChange={(e) => handleChange('landing_section5_product_3_currency', e.target.value)}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_3_image || ''}
                            onChange={(e) => handleChange('landing_section5_product_3_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Link URL</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_3_link || ''}
                            onChange={(e) => handleChange('landing_section5_product_3_link', e.target.value)}
                            placeholder="/tailors"
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="setting-item">
                          <label>Color Swatches</label>
                          <p className="setting-description">Comma-separated hex colors (e.g., #D4A574,#8B7355,#2C2C2C)</p>
                          <input
                            type="text"
                            value={settings.landing_section5_product_3_colors || ''}
                            onChange={(e) => handleChange('landing_section5_product_3_colors', e.target.value)}
                            placeholder="#D4A574,#8B7355,#2C2C2C,#E8E4DC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product 4 */}
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 style={{ marginBottom: '12px' }}>Product 4</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Product Name</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_4_name || ''}
                            onChange={(e) => handleChange('landing_section5_product_4_name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="setting-item">
                          <label>Price</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_4_price || ''}
                            onChange={(e) => handleChange('landing_section5_product_4_price', e.target.value)}
                            placeholder="149,00"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="setting-item">
                          <label>Currency</label>
                          <select
                            value={settings.landing_section5_product_4_currency || 'EUR'}
                            onChange={(e) => handleChange('landing_section5_product_4_currency', e.target.value)}
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_4_image || ''}
                            onChange={(e) => handleChange('landing_section5_product_4_image', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="setting-item">
                          <label>Link URL</label>
                          <input
                            type="text"
                            value={settings.landing_section5_product_4_link || ''}
                            onChange={(e) => handleChange('landing_section5_product_4_link', e.target.value)}
                            placeholder="/tailors"
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="setting-item">
                          <label>Color Swatches</label>
                          <p className="setting-description">Comma-separated hex colors (e.g., #D4A574,#8B7355,#2C2C2C)</p>
                          <input
                            type="text"
                            value={settings.landing_section5_product_4_colors || ''}
                            onChange={(e) => handleChange('landing_section5_product_4_colors', e.target.value)}
                            placeholder="#D4A574,#8B7355,#2C2C2C,#E8E4DC"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mobile' && (
              <div className="settings-section">
                <h3>Mobile App Settings</h3>
                <p className="section-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                  Configure splash screen and onboarding for the mobile apps
                </p>

                {/* General Mobile Settings */}
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="setting-item">
                      <label>App Name</label>
                      <p className="setting-description">Display name shown in the mobile apps</p>
                      <input
                        type="text"
                        value={settings.mobile_app_name || 'Tailor Connect'}
                        onChange={(e) => handleChange('mobile_app_name', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="setting-item">
                      <label>Primary Color</label>
                      <p className="setting-description">Main accent color for the mobile apps (hex)</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={settings.mobile_primary_color || '#5c8d6a'}
                          onChange={(e) => handleChange('mobile_primary_color', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <input
                          type="color"
                          value={settings.mobile_primary_color || '#5c8d6a'}
                          onChange={(e) => handleChange('mobile_primary_color', e.target.value)}
                          style={{ width: '40px', height: '40px', padding: '2px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer App Section */}
                <div style={{ borderTop: '3px solid var(--primary)', paddingTop: '32px', marginTop: '32px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Customer App - Onboarding Screen</h3>
                  <p className="setting-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Customize the splash/onboarding screen for the Customer mobile app
                  </p>

                  <div className="row g-4">
                    <div className="col-12">
                      <div className="setting-item">
                        <label>Background Image URL</label>
                        <p className="setting-description">Full-screen background image for the customer onboarding screen</p>
                        <input
                          type="text"
                          value={settings.mobile_customer_splash_image || ''}
                          onChange={(e) => handleChange('mobile_customer_splash_image', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      {settings.mobile_customer_splash_image && (
                        <div style={{ marginTop: '12px', maxWidth: '200px' }}>
                          <img
                            src={settings.mobile_customer_splash_image}
                            alt="Customer splash preview"
                            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Headline</label>
                        <p className="setting-description">Main title text on the splash screen</p>
                        <input
                          type="text"
                          value={settings.mobile_customer_splash_headline || 'Find Your Perfect Tailor'}
                          onChange={(e) => handleChange('mobile_customer_splash_headline', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Subheadline</label>
                        <p className="setting-description">Subtitle text below the headline</p>
                        <input
                          type="text"
                          value={settings.mobile_customer_splash_subheadline || 'Connect with skilled tailors in your area'}
                          onChange={(e) => handleChange('mobile_customer_splash_subheadline', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tailor App Section */}
                <div style={{ borderTop: '3px solid var(--primary)', paddingTop: '32px', marginTop: '32px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Tailor App - Onboarding Screen</h3>
                  <p className="section-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Customize the splash/onboarding screen for the Tailor mobile app
                  </p>

                  <div className="row g-4">
                    <div className="col-12">
                      <div className="setting-item">
                        <label>Background Image URL</label>
                        <p className="setting-description">Full-screen background image for the tailor onboarding screen</p>
                        <input
                          type="text"
                          value={settings.mobile_tailor_splash_image || ''}
                          onChange={(e) => handleChange('mobile_tailor_splash_image', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      {settings.mobile_tailor_splash_image && (
                        <div style={{ marginTop: '12px', maxWidth: '200px' }}>
                          <img
                            src={settings.mobile_tailor_splash_image}
                            alt="Tailor splash preview"
                            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Headline</label>
                        <p className="setting-description">Main title text on the splash screen</p>
                        <input
                          type="text"
                          value={settings.mobile_tailor_splash_headline || 'Grow Your Tailoring Business'}
                          onChange={(e) => handleChange('mobile_tailor_splash_headline', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="setting-item">
                        <label>Subheadline</label>
                        <p className="setting-description">Subtitle text below the headline</p>
                        <input
                          type="text"
                          value={settings.mobile_tailor_splash_subheadline || 'Reach more customers and manage your orders'}
                          onChange={(e) => handleChange('mobile_tailor_splash_subheadline', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
