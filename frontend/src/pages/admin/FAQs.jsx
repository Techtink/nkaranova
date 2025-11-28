import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHelpCircle, FiChevronDown, FiChevronUp, FiEye, FiEyeOff, FiMove } from 'react-icons/fi';
import { faqAPI } from '../../services/api';
import './Admin.scss';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'account', label: 'Account' },
  { value: 'orders', label: 'Orders' },
  { value: 'payments', label: 'Payments' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'returns', label: 'Returns' },
  { value: 'tailors', label: 'For Tailors' },
  { value: 'customers', label: 'For Customers' }
];

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'customers', label: 'Customers Only' },
  { value: 'tailors', label: 'Tailors Only' }
];

export default function AdminFAQs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAudience, setFilterAudience] = useState('');

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    targetAudience: 'all',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    fetchFAQs();
  }, [filterCategory, filterAudience]);

  const fetchFAQs = async () => {
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterAudience) params.audience = filterAudience;

      const response = await faqAPI.getAdmin(params);
      setFaqs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        targetAudience: faq.targetAudience,
        order: faq.order,
        isActive: faq.isActive
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: '',
        answer: '',
        category: 'general',
        targetAudience: 'all',
        order: faqs.length,
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      targetAudience: 'all',
      order: 0,
      isActive: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingFaq) {
        await faqAPI.update(editingFaq._id, formData);
      } else {
        await faqAPI.create(formData);
      }

      handleCloseModal();
      fetchFAQs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert(error.response?.data?.message || 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      await faqAPI.delete(id);
      fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Failed to delete FAQ');
    }
  };

  const handleToggleActive = async (faq) => {
    try {
      await faqAPI.update(faq._id, { isActive: !faq.isActive });
      fetchFAQs();
    } catch (error) {
      console.error('Error toggling FAQ:', error);
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[index - 1].order;
    newFaqs[index - 1].order = newFaqs[index].order;
    newFaqs[index].order = temp;

    try {
      await faqAPI.reorder([
        { id: newFaqs[index - 1]._id, order: newFaqs[index - 1].order },
        { id: newFaqs[index]._id, order: newFaqs[index].order }
      ]);
      fetchFAQs();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const handleMoveDown = async (index) => {
    if (index === faqs.length - 1) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[index + 1].order;
    newFaqs[index + 1].order = newFaqs[index].order;
    newFaqs[index].order = temp;

    try {
      await faqAPI.reorder([
        { id: newFaqs[index + 1]._id, order: newFaqs[index + 1].order },
        { id: newFaqs[index]._id, order: newFaqs[index].order }
      ]);
      fetchFAQs();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const getCategoryLabel = (value) => {
    return CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const getAudienceLabel = (value) => {
    return AUDIENCES.find(a => a.value === value)?.label || value;
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
        {/* Header */}
        <div className="erp-page-header">
          <div className="header-top">
            <div className="header-left">
              <div className="header-icon">
                <FiHelpCircle />
              </div>
              <div className="header-text">
                <h1>FAQ Management</h1>
                <p>Create and manage help & support questions and answers</p>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="btn-erp btn-erp-primary"
                onClick={() => handleOpenModal()}
              >
                <FiPlus />
                Add FAQ
              </button>
            </div>
          </div>
          <div className="header-line" />
        </div>

        {/* Filters */}
        <div className="erp-filters" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Target Audience</label>
            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
            >
              <option value="">All Audiences</option>
              {AUDIENCES.map(aud => (
                <option key={aud.value} value={aud.value}>{aud.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FAQ List */}
        <div className="erp-card">
          <div className="card-body" style={{ padding: 0 }}>
            {faqs.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <FiHelpCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No FAQs found. Click "Add FAQ" to create one.</p>
              </div>
            ) : (
              <div className="faq-list">
                {faqs.map((faq, index) => (
                  <div
                    key={faq._id}
                    className={`faq-item ${expandedId === faq._id ? 'expanded' : ''} ${!faq.isActive ? 'inactive' : ''}`}
                    style={{
                      borderBottom: index < faqs.length - 1 ? '1px solid var(--border-color)' : 'none',
                      opacity: faq.isActive ? 1 : 0.6
                    }}
                  >
                    <div
                      className="faq-header"
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedId(expandedId === faq._id ? null : faq._id)}
                    >
                      <div className="faq-order-controls" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                          disabled={index === 0}
                          style={{
                            padding: '2px',
                            background: 'none',
                            border: 'none',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            color: index === 0 ? 'var(--text-muted)' : 'var(--text-secondary)'
                          }}
                        >
                          <FiChevronUp size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                          disabled={index === faqs.length - 1}
                          style={{
                            padding: '2px',
                            background: 'none',
                            border: 'none',
                            cursor: index === faqs.length - 1 ? 'not-allowed' : 'pointer',
                            color: index === faqs.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)'
                          }}
                        >
                          <FiChevronDown size={14} />
                        </button>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{faq.question}</span>
                          {!faq.isActive && (
                            <span className="erp-badge badge-muted" style={{ fontSize: '10px' }}>Hidden</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className="erp-badge badge-outline" style={{ fontSize: '11px' }}>
                            {getCategoryLabel(faq.category)}
                          </span>
                          <span className="erp-badge badge-secondary" style={{ fontSize: '11px' }}>
                            {getAudienceLabel(faq.targetAudience)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(faq); }}
                          title={faq.isActive ? 'Hide FAQ' : 'Show FAQ'}
                          style={{
                            padding: '8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: faq.isActive ? 'var(--success)' : 'var(--text-muted)'
                          }}
                        >
                          {faq.isActive ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(faq); }}
                          title="Edit FAQ"
                          style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(faq._id); }}
                          title="Delete FAQ"
                          style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                        >
                          <FiTrash2 size={18} />
                        </button>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {expandedId === faq._id ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                      </div>
                    </div>

                    {expandedId === faq._id && (
                      <div
                        className="faq-answer"
                        style={{
                          padding: '0 20px 16px 48px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={handleCloseModal}
          >
            <div
              className="modal-content"
              style={{
                background: 'var(--bg-primary)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>
                  {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Question *
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    required
                    placeholder="Enter the question..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Answer *
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    required
                    rows={6}
                    placeholder="Enter the answer..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)'
                      }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Target Audience
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)'
                      }}
                    >
                      {AUDIENCES.map(aud => (
                        <option key={aud.value} value={aud.value}>{aud.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive">Active (visible to users)</label>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-erp btn-erp-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-erp btn-erp-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingFaq ? 'Save Changes' : 'Create FAQ')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
