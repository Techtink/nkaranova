import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX, FiLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { worksAPI, uploadsAPI } from '../../services/api';
import { WORK_CATEGORIES } from '../../utils/constants';
import './Portfolio.scss';

export default function TailorPortfolio() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWork, setEditingWork] = useState(null);

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      const response = await worksAPI.getMyWorks();
      setWorks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workId) => {
    if (!confirm('Are you sure you want to delete this work?')) return;

    try {
      await worksAPI.delete(workId);
      setWorks(prev => prev.filter(w => w._id !== workId));
      toast.success('Work deleted');
    } catch (error) {
      toast.error('Failed to delete work');
    }
  };

  const handleEdit = (work) => {
    setEditingWork(work);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingWork(null);
    setShowModal(true);
  };

  const handleSave = async (data) => {
    try {
      if (editingWork) {
        await worksAPI.update(editingWork._id, data);
        toast.success('Work updated');
      } else {
        await worksAPI.create(data);
        toast.success('Work added');
      }
      fetchWorks();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="portfolio-page page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Portfolio</h1>
            <p>Showcase your best work to attract customers</p>
          </div>
          <Button onClick={handleAddNew}>
            <FiPlus /> Add Work
          </Button>
        </div>

        {works.length === 0 ? (
          <div className="empty-state">
            <FiImage style={{ width: 64, height: 64 }} />
            <h3>No works yet</h3>
            <p>Start building your portfolio by adding your best work</p>
            <Button onClick={handleAddNew}>Add Your First Work</Button>
          </div>
        ) : (
          <div className="works-grid">
            {works.map(work => (
              <div key={work._id} className="work-item">
                <div className="work-image">
                  {work.images?.[0]?.url ? (
                    <img src={work.images[0].url} alt={work.title} />
                  ) : (
                    <div className="placeholder">No Image</div>
                  )}
                  <span className={`status-badge badge-${work.approvalStatus === 'approved' ? 'success' : work.approvalStatus === 'pending' ? 'warning' : 'error'}`}>
                    {work.approvalStatus}
                  </span>
                </div>
                <div className="work-info">
                  <h3>{work.title}</h3>
                  <p className="category">{work.category}</p>
                  <div className="work-actions">
                    <button onClick={() => handleEdit(work)}>
                      <FiEdit2 /> Edit
                    </button>
                    <button onClick={() => handleDelete(work._id)} className="danger">
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingWork ? 'Edit Work' : 'Add New Work'}
          size="lg"
        >
          <WorkForm
            work={editingWork}
            onSave={handleSave}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      </div>
    </div>
  );
}

function WorkForm({ work, onSave, onCancel }) {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: work?.title || '',
    description: work?.description || '',
    category: work?.category || '',
    price: work?.price?.amount || '',
    fabricTypes: work?.fabricTypes?.join(', ') || ''
  });
  const [images, setImages] = useState(work?.images || []);
  const [newFiles, setNewFiles] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let uploadedImages = [...images];

      // Upload new files if any
      if (newFiles.length > 0) {
        setUploading(true);
        const filesToUpload = newFiles.map(item => item.file);
        const response = await uploadsAPI.uploadWorkImages(filesToUpload);
        uploadedImages = [...uploadedImages, ...response.data.data];
        setUploading(false);
      }

      // Mark first image as primary if none is primary
      if (uploadedImages.length > 0 && !uploadedImages.some(img => img.isPrimary)) {
        uploadedImages[0].isPrimary = true;
      }

      const data = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        images: uploadedImages,
        price: formData.price ? { amount: parseFloat(formData.price), currency: 'USD' } : undefined,
        fabricTypes: formData.fabricTypes.split(',').map(s => s.trim()).filter(Boolean)
      };

      await onSave(data);
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    // Create preview URLs
    const filesWithPreview = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setNewFiles(prev => [...prev, ...filesWithPreview]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeExistingImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index) => {
    setNewFiles(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addUrlImage = () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput);
      setImages(prev => [...prev, { url: urlInput, isPrimary: prev.length === 0 }]);
      setUrlInput('');
      setShowUrlInput(false);
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const setPrimaryImage = (index, isExisting) => {
    if (isExisting) {
      setImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="work-form">
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        required
      />

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          required
        >
          <option value="">Select category</option>
          {WORK_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Images</label>

        {/* Existing and new images preview */}
        <div className="images-preview">
          {images.map((img, index) => (
            <div key={`existing-${index}`} className={`image-item ${img.isPrimary ? 'primary' : ''}`}>
              <img src={img.url} alt={`Work ${index + 1}`} />
              <div className="image-actions">
                <button type="button" onClick={() => setPrimaryImage(index, true)} title="Set as primary">
                  {img.isPrimary ? '★' : '☆'}
                </button>
                <button type="button" onClick={() => removeExistingImage(index)} className="remove">
                  <FiX />
                </button>
              </div>
            </div>
          ))}
          {newFiles.map((item, index) => (
            <div key={`new-${index}`} className="image-item new">
              <img src={item.preview} alt={item.name} />
              <div className="image-actions">
                <button type="button" onClick={() => removeNewFile(index)} className="remove">
                  <FiX />
                </button>
              </div>
              <span className="new-badge">New</span>
            </div>
          ))}
        </div>

        {/* Upload area */}
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <FiUpload size={24} />
          <p>Drag & drop images here or click to browse</p>
          <span>Max 5MB per image</span>
        </div>

        {/* URL input option */}
        <div className="url-option">
          {showUrlInput ? (
            <div className="url-input-row">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <button type="button" onClick={addUrlImage}>Add</button>
              <button type="button" onClick={() => { setShowUrlInput(false); setUrlInput(''); }}>
                <FiX />
              </button>
            </div>
          ) : (
            <button type="button" className="link-btn" onClick={() => setShowUrlInput(true)}>
              <FiLink /> Add image from URL
            </button>
          )}
        </div>
      </div>

      <Input
        label="Price (USD)"
        type="number"
        value={formData.price}
        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
        placeholder="Starting price"
      />

      <Input
        label="Fabric Types (comma separated)"
        value={formData.fabricTypes}
        onChange={(e) => setFormData(prev => ({ ...prev, fabricTypes: e.target.value }))}
        placeholder="Cotton, Silk, Lace"
      />

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving || uploading}>
          {uploading ? 'Uploading...' : 'Save Work'}
        </Button>
      </div>
    </form>
  );
}

// Import icon for empty state
import { FiImage } from 'react-icons/fi';
