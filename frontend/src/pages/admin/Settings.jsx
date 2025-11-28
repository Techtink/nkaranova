import { useState, useEffect, useRef } from 'react';
import { FiSave, FiRefreshCw, FiDollarSign, FiUsers, FiStar, FiSettings, FiImage, FiUpload, FiX, FiSmartphone, FiCrop, FiLink, FiCreditCard, FiMessageCircle, FiMail, FiMessageSquare, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { settingsAPI } from '../../services/api';
import ImageCropper from '../../components/ImageCropper';
import './Admin.scss';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('referral');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperTarget, setCropperTarget] = useState(null); // 'customer' or 'tailor'
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [showSecrets, setShowSecrets] = useState({}); // Track which secret fields are visible
  const fileInputRef = useRef(null);

  // Toggle visibility of a secret field
  const toggleSecretVisibility = (field) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

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

  const openCropper = (target) => {
    setCropperTarget(target);
    setCropperOpen(true);
  };

  const handleCroppedImage = async (blob, previewUrl) => {
    if (!cropperTarget) return;

    setUploadingMobile(true);
    try {
      // Create a File from the blob
      const file = new File([blob], `splash_${cropperTarget}_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Upload the cropped image
      const response = await settingsAPI.uploadHeroImage(file);
      if (response.data.success) {
        const settingKey = cropperTarget === 'customer'
          ? 'mobile_customer_splash_image'
          : 'mobile_tailor_splash_image';
        handleChange(settingKey, response.data.data.url);
        alert('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading cropped image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingMobile(false);
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleRemoveMobileImage = (target) => {
    const settingKey = target === 'customer'
      ? 'mobile_customer_splash_image'
      : 'mobile_tailor_splash_image';
    handleChange(settingKey, '');
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
          <button
            className={`erp-tab ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            <FiLink />
            Integrations
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
                        <label>Background Image</label>
                        <p className="setting-description">Full-screen background image for the customer onboarding screen (9:16 portrait ratio)</p>

                        {settings.mobile_customer_splash_image ? (
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginTop: '12px' }}>
                            <div style={{ width: '150px' }}>
                              <div style={{
                                width: '150px',
                                height: '300px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '3px solid #333',
                                background: '#000'
                              }}>
                                <img
                                  src={settings.mobile_customer_splash_image}
                                  alt="Customer splash preview"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                className="btn-erp btn-erp-secondary"
                                onClick={() => openCropper('customer')}
                                disabled={uploadingMobile}
                              >
                                <FiCrop /> Change Image
                              </button>
                              <button
                                className="btn-erp btn-erp-danger"
                                onClick={() => handleRemoveMobileImage('customer')}
                                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                              >
                                <FiX /> Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => openCropper('customer')}
                            style={{
                              marginTop: '12px',
                              padding: '40px',
                              border: '2px dashed var(--border-color)',
                              borderRadius: '12px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--primary)';
                              e.currentTarget.style.background = 'rgba(92, 141, 106, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <FiCrop size={32} style={{ marginBottom: '12px', color: 'var(--primary)' }} />
                            <p style={{ margin: 0, fontWeight: '500' }}>Click to upload & crop image</p>
                            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                              Supports JPG, PNG, WebP (max 10MB)
                            </span>
                          </div>
                        )}
                      </div>
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
                        <label>Background Image</label>
                        <p className="setting-description">Full-screen background image for the tailor onboarding screen (9:16 portrait ratio)</p>

                        {settings.mobile_tailor_splash_image ? (
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginTop: '12px' }}>
                            <div style={{ width: '150px' }}>
                              <div style={{
                                width: '150px',
                                height: '300px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '3px solid #333',
                                background: '#000'
                              }}>
                                <img
                                  src={settings.mobile_tailor_splash_image}
                                  alt="Tailor splash preview"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                className="btn-erp btn-erp-secondary"
                                onClick={() => openCropper('tailor')}
                                disabled={uploadingMobile}
                              >
                                <FiCrop /> Change Image
                              </button>
                              <button
                                className="btn-erp btn-erp-danger"
                                onClick={() => handleRemoveMobileImage('tailor')}
                                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                              >
                                <FiX /> Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => openCropper('tailor')}
                            style={{
                              marginTop: '12px',
                              padding: '40px',
                              border: '2px dashed var(--border-color)',
                              borderRadius: '12px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--primary)';
                              e.currentTarget.style.background = 'rgba(92, 141, 106, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <FiCrop size={32} style={{ marginBottom: '12px', color: 'var(--primary)' }} />
                            <p style={{ margin: 0, fontWeight: '500' }}>Click to upload & crop image</p>
                            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                              Supports JPG, PNG, WebP (max 10MB)
                            </span>
                          </div>
                        )}
                      </div>
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

            {activeTab === 'integrations' && (
              <div className="settings-section">
                <h3>Integration Settings</h3>
                <p className="section-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                  Configure payment gateways and communication services for your platform
                </p>

                {/* Payment Gateways Section */}
                <div style={{ borderTop: '3px solid var(--primary)', paddingTop: '32px', marginTop: '16px' }}>
                  <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiCreditCard />
                    Payment Gateways
                  </h3>
                  <p className="setting-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Configure payment processing for your platform
                  </p>

                  {/* Stripe Settings */}
                  <div style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#635BFF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>S</span>
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>Stripe</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Accept credit cards, Apple Pay, Google Pay</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.stripe_enabled || false}
                          onChange={(e) => handleChange('stripe_enabled', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {settings.stripe_enabled && (
                      <>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="setting-item">
                              <label>Mode</label>
                              <select
                                value={settings.stripe_mode || 'test'}
                                onChange={(e) => handleChange('stripe_mode', e.target.value)}
                              >
                                <option value="test">Test Mode</option>
                                <option value="live">Live Mode</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Test Keys */}
                        <div style={{ marginTop: '24px', padding: '16px', background: settings.stripe_mode === 'test' ? 'rgba(92, 141, 106, 0.1)' : 'transparent', borderRadius: '8px', border: settings.stripe_mode === 'test' ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}>
                          <h5 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Test Keys
                            {settings.stripe_mode === 'test' && <span className="erp-badge badge-success" style={{ fontSize: '11px' }}>Active</span>}
                          </h5>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="setting-item">
                                <label>Publishable Key</label>
                                <input
                                  type="text"
                                  value={settings.stripe_test_publishable_key || ''}
                                  onChange={(e) => handleChange('stripe_test_publishable_key', e.target.value)}
                                  placeholder="pk_test_..."
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="setting-item">
                                <label>Secret Key</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type={showSecrets.stripe_test_secret ? 'text' : 'password'}
                                    value={settings.stripe_test_secret_key || ''}
                                    onChange={(e) => handleChange('stripe_test_secret_key', e.target.value)}
                                    placeholder="sk_test_..."
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn-erp btn-erp-secondary"
                                    onClick={() => toggleSecretVisibility('stripe_test_secret')}
                                    style={{ padding: '8px 12px' }}
                                  >
                                    {showSecrets.stripe_test_secret ? <FiEyeOff /> : <FiEye />}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="setting-item">
                                <label>Webhook Secret</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type={showSecrets.stripe_test_webhook ? 'text' : 'password'}
                                    value={settings.stripe_test_webhook_secret || ''}
                                    onChange={(e) => handleChange('stripe_test_webhook_secret', e.target.value)}
                                    placeholder="whsec_..."
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn-erp btn-erp-secondary"
                                    onClick={() => toggleSecretVisibility('stripe_test_webhook')}
                                    style={{ padding: '8px 12px' }}
                                  >
                                    {showSecrets.stripe_test_webhook ? <FiEyeOff /> : <FiEye />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Live Keys */}
                        <div style={{ marginTop: '16px', padding: '16px', background: settings.stripe_mode === 'live' ? 'rgba(92, 141, 106, 0.1)' : 'transparent', borderRadius: '8px', border: settings.stripe_mode === 'live' ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}>
                          <h5 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Live Keys
                            {settings.stripe_mode === 'live' && <span className="erp-badge badge-success" style={{ fontSize: '11px' }}>Active</span>}
                          </h5>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="setting-item">
                                <label>Publishable Key</label>
                                <input
                                  type="text"
                                  value={settings.stripe_live_publishable_key || ''}
                                  onChange={(e) => handleChange('stripe_live_publishable_key', e.target.value)}
                                  placeholder="pk_live_..."
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="setting-item">
                                <label>Secret Key</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type={showSecrets.stripe_live_secret ? 'text' : 'password'}
                                    value={settings.stripe_live_secret_key || ''}
                                    onChange={(e) => handleChange('stripe_live_secret_key', e.target.value)}
                                    placeholder="sk_live_..."
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn-erp btn-erp-secondary"
                                    onClick={() => toggleSecretVisibility('stripe_live_secret')}
                                    style={{ padding: '8px 12px' }}
                                  >
                                    {showSecrets.stripe_live_secret ? <FiEyeOff /> : <FiEye />}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="setting-item">
                                <label>Webhook Secret</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type={showSecrets.stripe_live_webhook ? 'text' : 'password'}
                                    value={settings.stripe_live_webhook_secret || ''}
                                    onChange={(e) => handleChange('stripe_live_webhook_secret', e.target.value)}
                                    placeholder="whsec_..."
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn-erp btn-erp-secondary"
                                    onClick={() => toggleSecretVisibility('stripe_live_webhook')}
                                    style={{ padding: '8px 12px' }}
                                  >
                                    {showSecrets.stripe_live_webhook ? <FiEyeOff /> : <FiEye />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Paystack Settings */}
                  <div style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#00C3F7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>P</span>
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>Paystack</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Accept payments in Nigeria, Ghana, South Africa, Kenya</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.paystack_enabled || false}
                          onChange={(e) => handleChange('paystack_enabled', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {settings.paystack_enabled && (
                      <>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="setting-item">
                              <label>Mode</label>
                              <select
                                value={settings.paystack_mode || 'test'}
                                onChange={(e) => handleChange('paystack_mode', e.target.value)}
                              >
                                <option value="test">Test Mode</option>
                                <option value="live">Live Mode</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Test Keys */}
                        <div style={{ marginTop: '24px', padding: '16px', background: settings.paystack_mode === 'test' ? 'rgba(92, 141, 106, 0.1)' : 'transparent', borderRadius: '8px', border: settings.paystack_mode === 'test' ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}>
                          <h5 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Test Keys
                            {settings.paystack_mode === 'test' && <span className="erp-badge badge-success" style={{ fontSize: '11px' }}>Active</span>}
                          </h5>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="setting-item">
                                <label>Public Key</label>
                                <input
                                  type="text"
                                  value={settings.paystack_test_public_key || ''}
                                  onChange={(e) => handleChange('paystack_test_public_key', e.target.value)}
                                  placeholder="pk_test_..."
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="setting-item">
                                <label>Secret Key</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type={showSecrets.paystack_test_secret ? 'text' : 'password'}
                                    value={settings.paystack_test_secret_key || ''}
                                    onChange={(e) => handleChange('paystack_test_secret_key', e.target.value)}
                                    placeholder="sk_test_..."
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn-erp btn-erp-secondary"
                                    onClick={() => toggleSecretVisibility('paystack_test_secret')}
                                    style={{ padding: '8px 12px' }}
                                  >
                                    {showSecrets.paystack_test_secret ? <FiEyeOff /> : <FiEye />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Live Keys */}
                        <div style={{ marginTop: '16px', padding: '16px', background: settings.paystack_mode === 'live' ? 'rgba(92, 141, 106, 0.1)' : 'transparent', borderRadius: '8px', border: settings.paystack_mode === 'live' ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}>
                          <h5 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Live Keys
                            {settings.paystack_mode === 'live' && <span className="erp-badge badge-success" style={{ fontSize: '11px' }}>Active</span>}
                          </h5>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="setting-item">
                                <label>Public Key</label>
                                <input
                                  type="text"
                                  value={settings.paystack_live_public_key || ''}
                                  onChange={(e) => handleChange('paystack_live_public_key', e.target.value)}
                                  placeholder="pk_live_..."
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="setting-item">
                                <label>Secret Key</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type={showSecrets.paystack_live_secret ? 'text' : 'password'}
                                    value={settings.paystack_live_secret_key || ''}
                                    onChange={(e) => handleChange('paystack_live_secret_key', e.target.value)}
                                    placeholder="sk_live_..."
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className="btn-erp btn-erp-secondary"
                                    onClick={() => toggleSecretVisibility('paystack_live_secret')}
                                    style={{ padding: '8px 12px' }}
                                  >
                                    {showSecrets.paystack_live_secret ? <FiEyeOff /> : <FiEye />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Communication Services Section */}
                <div style={{ borderTop: '3px solid var(--primary)', paddingTop: '32px', marginTop: '32px' }}>
                  <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiMessageCircle />
                    Communication Services
                  </h3>
                  <p className="setting-description" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Configure messaging and notification channels
                  </p>

                  {/* WhatsApp Settings */}
                  <div style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#25D366', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiMessageCircle size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>WhatsApp Business API</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Send notifications and updates via WhatsApp</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.whatsapp_enabled || false}
                          onChange={(e) => handleChange('whatsapp_enabled', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {settings.whatsapp_enabled && (
                      <div className="row g-4">
                        <div className="col-md-6">
                          <div className="setting-item">
                            <label>Phone Number ID</label>
                            <p className="setting-description">From Meta Business Suite</p>
                            <input
                              type="text"
                              value={settings.whatsapp_phone_number_id || ''}
                              onChange={(e) => handleChange('whatsapp_phone_number_id', e.target.value)}
                              placeholder="123456789012345"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="setting-item">
                            <label>Business Account ID</label>
                            <p className="setting-description">WhatsApp Business Account ID</p>
                            <input
                              type="text"
                              value={settings.whatsapp_business_account_id || ''}
                              onChange={(e) => handleChange('whatsapp_business_account_id', e.target.value)}
                              placeholder="123456789012345"
                            />
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="setting-item">
                            <label>Access Token</label>
                            <p className="setting-description">Permanent access token from Meta</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type={showSecrets.whatsapp_token ? 'text' : 'password'}
                                value={settings.whatsapp_access_token || ''}
                                onChange={(e) => handleChange('whatsapp_access_token', e.target.value)}
                                placeholder="EAAxxxxxxx..."
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                className="btn-erp btn-erp-secondary"
                                onClick={() => toggleSecretVisibility('whatsapp_token')}
                                style={{ padding: '8px 12px' }}
                              >
                                {showSecrets.whatsapp_token ? <FiEyeOff /> : <FiEye />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="setting-item">
                            <label>Webhook Verify Token</label>
                            <p className="setting-description">Custom token for webhook verification</p>
                            <input
                              type="text"
                              value={settings.whatsapp_verify_token || ''}
                              onChange={(e) => handleChange('whatsapp_verify_token', e.target.value)}
                              placeholder="your-custom-verify-token"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Amazon SES Settings */}
                  <div style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#FF9900', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiMail size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>Amazon SES</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Send transactional emails via Amazon Simple Email Service</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.ses_enabled || false}
                          onChange={(e) => handleChange('ses_enabled', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {settings.ses_enabled && (
                      <div className="row g-4">
                        <div className="col-md-4">
                          <div className="setting-item">
                            <label>AWS Region</label>
                            <select
                              value={settings.ses_region || 'us-east-1'}
                              onChange={(e) => handleChange('ses_region', e.target.value)}
                            >
                              <option value="us-east-1">US East (N. Virginia)</option>
                              <option value="us-east-2">US East (Ohio)</option>
                              <option value="us-west-1">US West (N. California)</option>
                              <option value="us-west-2">US West (Oregon)</option>
                              <option value="eu-west-1">EU (Ireland)</option>
                              <option value="eu-west-2">EU (London)</option>
                              <option value="eu-central-1">EU (Frankfurt)</option>
                              <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                              <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                              <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                              <option value="af-south-1">Africa (Cape Town)</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="setting-item">
                            <label>Access Key ID</label>
                            <input
                              type="text"
                              value={settings.ses_access_key_id || ''}
                              onChange={(e) => handleChange('ses_access_key_id', e.target.value)}
                              placeholder="AKIAIOSFODNN7EXAMPLE"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="setting-item">
                            <label>Secret Access Key</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type={showSecrets.ses_secret ? 'text' : 'password'}
                                value={settings.ses_secret_access_key || ''}
                                onChange={(e) => handleChange('ses_secret_access_key', e.target.value)}
                                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                className="btn-erp btn-erp-secondary"
                                onClick={() => toggleSecretVisibility('ses_secret')}
                                style={{ padding: '8px 12px' }}
                              >
                                {showSecrets.ses_secret ? <FiEyeOff /> : <FiEye />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="setting-item">
                            <label>From Email</label>
                            <p className="setting-description">Must be verified in SES</p>
                            <input
                              type="email"
                              value={settings.ses_from_email || ''}
                              onChange={(e) => handleChange('ses_from_email', e.target.value)}
                              placeholder="noreply@yourdomain.com"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="setting-item">
                            <label>From Name</label>
                            <input
                              type="text"
                              value={settings.ses_from_name || 'Tailor Connect'}
                              onChange={(e) => handleChange('ses_from_name', e.target.value)}
                              placeholder="Tailor Connect"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="setting-item">
                            <label>Reply-To Email</label>
                            <input
                              type="email"
                              value={settings.ses_reply_to_email || ''}
                              onChange={(e) => handleChange('ses_reply_to_email', e.target.value)}
                              placeholder="support@yourdomain.com"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Termii SMS Settings */}
                  <div style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#1890FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiMessageSquare size={24} style={{ color: 'white' }} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>Termii</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Send SMS notifications across Africa</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.termii_enabled || false}
                          onChange={(e) => handleChange('termii_enabled', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    {settings.termii_enabled && (
                      <div className="row g-4">
                        <div className="col-md-6">
                          <div className="setting-item">
                            <label>API Key</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type={showSecrets.termii_key ? 'text' : 'password'}
                                value={settings.termii_api_key || ''}
                                onChange={(e) => handleChange('termii_api_key', e.target.value)}
                                placeholder="TLxxxxxxxxxxxxxxxxxxxxxxxx"
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                className="btn-erp btn-erp-secondary"
                                onClick={() => toggleSecretVisibility('termii_key')}
                                style={{ padding: '8px 12px' }}
                              >
                                {showSecrets.termii_key ? <FiEyeOff /> : <FiEye />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="setting-item">
                            <label>Sender ID</label>
                            <p className="setting-description">Max 11 characters</p>
                            <input
                              type="text"
                              value={settings.termii_sender_id || ''}
                              onChange={(e) => handleChange('termii_sender_id', e.target.value.slice(0, 11))}
                              placeholder="TailorConn"
                              maxLength={11}
                            />
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="setting-item">
                            <label>Channel</label>
                            <select
                              value={settings.termii_channel || 'generic'}
                              onChange={(e) => handleChange('termii_channel', e.target.value)}
                            >
                              <option value="generic">Generic</option>
                              <option value="dnd">DND (Do Not Disturb)</option>
                              <option value="whatsapp">WhatsApp</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Summary */}
                <div style={{ marginTop: '32px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '16px' }}>Integration Status</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      {settings.stripe_enabled ? <FiCheck style={{ color: 'var(--success)' }} /> : <FiAlertCircle style={{ color: 'var(--text-tertiary)' }} />}
                      <span>Stripe</span>
                      <span className={`erp-badge ${settings.stripe_enabled ? 'badge-success' : 'badge-secondary'}`} style={{ marginLeft: 'auto', fontSize: '11px' }}>
                        {settings.stripe_enabled ? (settings.stripe_mode === 'live' ? 'Live' : 'Test') : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      {settings.paystack_enabled ? <FiCheck style={{ color: 'var(--success)' }} /> : <FiAlertCircle style={{ color: 'var(--text-tertiary)' }} />}
                      <span>Paystack</span>
                      <span className={`erp-badge ${settings.paystack_enabled ? 'badge-success' : 'badge-secondary'}`} style={{ marginLeft: 'auto', fontSize: '11px' }}>
                        {settings.paystack_enabled ? (settings.paystack_mode === 'live' ? 'Live' : 'Test') : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      {settings.whatsapp_enabled ? <FiCheck style={{ color: 'var(--success)' }} /> : <FiAlertCircle style={{ color: 'var(--text-tertiary)' }} />}
                      <span>WhatsApp</span>
                      <span className={`erp-badge ${settings.whatsapp_enabled ? 'badge-success' : 'badge-secondary'}`} style={{ marginLeft: 'auto', fontSize: '11px' }}>
                        {settings.whatsapp_enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      {settings.ses_enabled ? <FiCheck style={{ color: 'var(--success)' }} /> : <FiAlertCircle style={{ color: 'var(--text-tertiary)' }} />}
                      <span>Amazon SES</span>
                      <span className={`erp-badge ${settings.ses_enabled ? 'badge-success' : 'badge-secondary'}`} style={{ marginLeft: 'auto', fontSize: '11px' }}>
                        {settings.ses_enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      {settings.termii_enabled ? <FiCheck style={{ color: 'var(--success)' }} /> : <FiAlertCircle style={{ color: 'var(--text-tertiary)' }} />}
                      <span>Termii SMS</span>
                      <span className={`erp-badge ${settings.termii_enabled ? 'badge-success' : 'badge-secondary'}`} style={{ marginLeft: 'auto', fontSize: '11px' }}>
                        {settings.termii_enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setCropperTarget(null);
        }}
        onCropComplete={handleCroppedImage}
        aspectRatio={9/16}
        title={`Crop ${cropperTarget === 'customer' ? 'Customer' : 'Tailor'} App Splash Image`}
      />
    </div>
  );
}
