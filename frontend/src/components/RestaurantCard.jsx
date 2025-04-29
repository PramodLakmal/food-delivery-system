import React from 'react';
import { Link } from 'react-router-dom';
import PlaceholderImage from './PlaceholderImage';

const RestaurantCard = ({ restaurant, linkPrefix = '', actions = null }) => {
  const {
    _id,
    name,
    location,
    cuisine,
    rating,
    isOpen,
    imageUrl
  } = restaurant;

  // Styles
  const card = {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    cursor: 'pointer',
    position: 'relative',
  };

  const hoverableCard = {
    ...card,
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    }
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
  };

  const detail = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
  };

  const statusBadge = {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: isOpen ? '#10b981' : '#ef4444',
  };

  const ratingBadge = {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#f59e0b',
    fontWeight: '500',
    marginTop: '0.5rem',
  };

  const starIcon = {
    marginRight: '0.25rem',
  };

  const renderActions = () => {
    if (!actions) return null;
    
    return (
      <div style={{ 
        marginTop: 'auto', 
        padding: '0.75rem 1rem',
        borderTop: '1px solid #e5e7eb', 
        display: 'flex', 
        justifyContent: 'flex-end',
        gap: '0.5rem'
      }}>
        {actions}
      </div>
    );
  };

  return (
    <div style={actions ? card : hoverableCard}>
      <Link 
        to={`${linkPrefix}/${_id}`} 
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flexGrow: 1 }}
      >
        <div style={imageContainer}>
          {imageUrl ? (
            <img src={imageUrl} alt={name} style={image} />
          ) : (
            <PlaceholderImage type="restaurant" width="100%" height="160px" />
          )}
          <div style={statusBadge}>
            {isOpen ? 'Open' : 'Closed'}
          </div>
        </div>
        
        <div style={content}>
          <h3 style={title}>{name}</h3>
          <p style={detail}><strong>Location:</strong> {location}</p>
          <p style={detail}><strong>Cuisine:</strong> {cuisine}</p>
          
          {rating > 0 && (
            <div style={ratingBadge}>
              <span style={starIcon}>★</span> {rating.toFixed(1)}
            </div>
          )}
        </div>
      </Link>
      {renderActions()}
    </div>
  );
};

export default RestaurantCard; 