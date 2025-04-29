import React, { useState, useRef } from 'react';

const ImageUpload = ({ imageUrl, setImageUrl, placeholderText = 'No image selected' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file (png, jpeg, jpg)');
      setLoading(false);
      return;
    }

    // Validate file size (max 5MB) - warn if over 1MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB. Please compress your image or choose a smaller one.');
      setLoading(false);
      return;
    }
    
    // Add a warning for larger images that might slow down the app
    if (file.size > 1024 * 1024) {
      console.warn('Large image detected. Images over 1MB may cause slower loading times.');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target.result);
      setLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read the file');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Styles
  const container = {
    marginBottom: '1rem',
  };

  const label = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: '0.5rem',
  };

  const uploadContainer = {
    border: '2px dashed #d1d5db',
    borderRadius: '0.375rem',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
  };

  const imagePreviewContainer = {
    marginTop: '1rem',
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const imagePreview = {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  };

  const uploadButton = {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const removeButton = {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const placeholderStyle = {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  };

  const errorStyle = {
    color: '#ef4444',
    fontSize: '0.75rem',
    marginTop: '0.5rem',
  };

  const loadingStyle = {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
  };

  return (
    <div style={container}>
      <label style={label}>Image</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <div style={uploadContainer} onClick={handleButtonClick}>
        {!imageUrl && (
          <p style={placeholderStyle}>{placeholderText}</p>
        )}
        <button type="button" style={uploadButton}>
          Choose Image
        </button>
      </div>

      {error && <p style={errorStyle}>{error}</p>}
      {loading && <p style={loadingStyle}>Loading image...</p>}

      {imageUrl && (
        <div style={imagePreviewContainer}>
          <img src={imageUrl} alt="Preview" style={imagePreview} />
          <button 
            type="button" 
            style={removeButton} 
            onClick={handleRemoveImage}
          >
            Remove Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 