import React from 'react';

const PlaceholderImage = ({ type = 'generic', width = '100%', height = '160px' }) => {
  // Define different background colors and icons for different types
  const placeholderConfig = {
    generic: {
      backgroundColor: '#e5e7eb',
      textColor: '#9ca3af',
      icon: '📷',
      text: 'No Image Available'
    },
    restaurant: {
      backgroundColor: '#e0f2fe',
      textColor: '#0284c7',
      icon: '🍽️',
      text: 'Restaurant Image'
    },
    menu: {
      backgroundColor: '#e0e7ff',
      textColor: '#4338ca',
      icon: '🍕',
      text: 'Food Image'
    },
    user: {
      backgroundColor: '#dcfce7',
      textColor: '#047857',
      icon: '👤',
      text: 'User Photo'
    }
  };

  const config = placeholderConfig[type] || placeholderConfig.generic;

  const container = {
    width,
    height,
    backgroundColor: config.backgroundColor,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: config.textColor,
    textAlign: 'center',
    padding: '1rem',
  };

  const iconStyle = {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  };

  const textStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
  };

  return (
    <div style={container}>
      <div style={iconStyle}>{config.icon}</div>
      <div style={textStyle}>{config.text}</div>
    </div>
  );
};

export default PlaceholderImage; 