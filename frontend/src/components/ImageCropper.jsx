import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FiX, FiCheck, FiZoomIn, FiZoomOut, FiRotateCw } from 'react-icons/fi';

// Helper function to create cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
};

export default function ImageCropper({
  isOpen,
  onClose,
  onCropComplete,
  aspectRatio = 9/16, // Mobile portrait aspect ratio
  title = 'Crop Image'
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setPreview(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePreview = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const previewUrl = URL.createObjectURL(croppedBlob);
      setPreview({ url: previewUrl, blob: croppedBlob });
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onCropComplete(preview.blob, preview.url);
      handleClose();
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <div className="cropper-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={handleClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className="cropper-content">
          {!imageSrc ? (
            <div className="file-select-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                id="cropper-file-input"
                style={{ display: 'none' }}
              />
              <label htmlFor="cropper-file-input" className="file-select-label">
                <div className="upload-icon">
                  <FiZoomIn size={48} />
                </div>
                <p>Click to select an image</p>
                <span>Supports JPG, PNG, WebP (max 10MB)</span>
              </label>
            </div>
          ) : preview ? (
            <div className="preview-area">
              <h4>Preview</h4>
              <div className="preview-container">
                <div className="phone-frame">
                  <img src={preview.url} alt="Preview" />
                </div>
              </div>
              <div className="preview-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setPreview(null)}
                >
                  Back to Edit
                </button>
                <button
                  className="btn-primary"
                  onClick={handleConfirm}
                >
                  <FiCheck /> Use This Image
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="cropper-area">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspectRatio}
                  onCropChange={onCropChange}
                  onZoomChange={onZoomChange}
                  onCropComplete={onCropCompleteCallback}
                />
              </div>

              <div className="cropper-controls">
                <div className="control-group">
                  <label>
                    <FiZoomOut />
                    Zoom
                    <FiZoomIn />
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                </div>

                <div className="control-group">
                  <label>
                    <FiRotateCw />
                    Rotation
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                  />
                  <span>{rotation}°</span>
                </div>
              </div>

              <div className="cropper-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setImageSrc(null)}
                >
                  Choose Different Image
                </button>
                <button
                  className="btn-primary"
                  onClick={generatePreview}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Preview Crop'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .image-cropper-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .image-cropper-modal {
          background: var(--bg-primary, #1a1a2e);
          border-radius: 16px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .cropper-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color, #333);
        }

        .cropper-header h3 {
          margin: 0;
          color: var(--text-primary, #fff);
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #aaa);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary, #fff);
        }

        .cropper-content {
          padding: 24px;
          overflow-y: auto;
        }

        .file-select-area {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .file-select-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          border: 2px dashed var(--border-color, #444);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          width: 100%;
        }

        .file-select-label:hover {
          border-color: var(--primary, #5c8d6a);
          background: rgba(92, 141, 106, 0.1);
        }

        .upload-icon {
          color: var(--primary, #5c8d6a);
          margin-bottom: 16px;
        }

        .file-select-label p {
          color: var(--text-primary, #fff);
          font-size: 16px;
          margin: 0 0 8px 0;
        }

        .file-select-label span {
          color: var(--text-secondary, #888);
          font-size: 13px;
        }

        .cropper-area {
          position: relative;
          width: 100%;
          height: 400px;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }

        .cropper-controls {
          display: flex;
          gap: 24px;
          margin-top: 20px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .control-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary, #aaa);
          font-size: 13px;
        }

        .control-group input[type="range"] {
          width: 100%;
          accent-color: var(--primary, #5c8d6a);
        }

        .control-group span {
          color: var(--text-primary, #fff);
          font-size: 12px;
          text-align: right;
        }

        .cropper-actions, .preview-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-secondary {
          padding: 12px 24px;
          border: 1px solid var(--border-color, #444);
          background: transparent;
          color: var(--text-primary, #fff);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-primary {
          padding: 12px 24px;
          border: none;
          background: var(--primary, #5c8d6a);
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .preview-area {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .preview-area h4 {
          color: var(--text-primary, #fff);
          margin: 0 0 20px 0;
        }

        .preview-container {
          display: flex;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          width: 100%;
        }

        .phone-frame {
          width: 200px;
          height: 400px;
          border-radius: 24px;
          overflow: hidden;
          border: 4px solid #333;
          background: #000;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .phone-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}
