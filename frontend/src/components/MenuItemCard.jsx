import React from 'react';
import PlaceholderImage from './PlaceholderImage';

const MenuItemCard = ({ menuItem, onEdit, onToggleAvailability }) => {
  const {
    _id,
    name,
    price,
    description,
    category,
    availability,
    imageUrl
  } = menuItem;

  // Styles
  const card = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  const imageContainer = {
    height: '160px',
    overflow: 'hidden',
    position: 'relative',
  };

  const image = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const content = {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  };

  const title = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const price_display = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#4f46e5',
  };

  const description_style = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
  };

  const categoryBadge = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
  };

  const statusBadge = {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    backgroundColor: availability ? '#dcfce7' : '#fee2e2',
    color: availability ? '#15803d' : '#b91c1c',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
    marginLeft: '0.5rem',
  };

  const actions = {
    marginTop: 'auto',
    padding: '0.75rem 1rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  };

  const editButton = {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#e0f2fe',
    color: '#0284c7',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
  };

  const toggleButton = {
    padding: '0.25rem 0.75rem',
    backgroundColor: availability ? '#fee2e2' : '#dcfce7',
    color: availability ? '#b91c1c' : '#15803d',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={card}>
      <div style={imageContainer}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} style={image} />
        ) : (
          <PlaceholderImage type="menu" width="100%" height="160px" />
        )}
      </div>
      
      <div style={content}>
        <div style={title}>
          <span>{name}</span>
          <span style={price_display}>${price.toFixed(2)}</span>
        </div>
        
        <div>
          <span style={categoryBadge}>{category}</span>
          <span style={statusBadge}>{availability ? 'Available' : 'Unavailable'}</span>
        </div>
        
        {description && (
          <p style={description_style}>{description}</p>
        )}
      </div>
      
      <div style={actions}>
        <button 
          style={toggleButton}
          onClick={() => onToggleAvailability && onToggleAvailability(_id, !availability)}
        >
          {availability ? 'Mark Unavailable' : 'Mark Available'}
        </button>
        <button 
          style={editButton}
          onClick={() => onEdit && onEdit(_id)}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard; 