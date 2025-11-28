import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { FiX, FiCheck, FiRotateCw } from 'react-icons/fi';
import './ImageCropper.scss';

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  circularCrop = true
}) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    aspect: aspectRatio
  });
  const [completedCrop, setCompletedCrop] = useState(null);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const cropSize = Math.min(width, height) * 0.8;
    const x = (width - cropSize) / 2;
    const y = (height - cropSize) / 2;

    setCrop({
      unit: 'px',
      width: cropSize,
      height: cropSize,
      x,
      y
    });
  }, []);

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to desired output size
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Draw the cropped image
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outputSize,
      outputSize
    );

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.jpg', {
              type: 'image/jpeg'
            });
            resolve(file);
          } else {
            resolve(null);
          }
        },
        'image/jpeg',
        0.9
      );
    });
  }, [completedCrop]);

  const handleSave = async () => {
    const croppedFile = await getCroppedImg();
    if (croppedFile) {
      onCropComplete(croppedFile);
    }
  };

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <div className="cropper-header">
          <h3>Crop Image</h3>
          <button className="close-btn" onClick={onCancel}>
            <FiX />
          </button>
        </div>

        <div className="cropper-body">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            circularCrop={circularCrop}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', maxWidth: '100%' }}
            />
          </ReactCrop>
        </div>

        <div className="cropper-footer">
          <p className="cropper-hint">Drag to reposition, corners to resize</p>
          <div className="cropper-actions">
            <button className="btn btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <FiCheck /> Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
