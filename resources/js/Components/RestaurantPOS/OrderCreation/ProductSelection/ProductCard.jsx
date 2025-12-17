import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  LocalFireDepartment as FireIcon,
  Star as StarIcon,
  ImageNotSupported as NoImageIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import TouchCard from '../Shared/TouchCard';
import { useThemeContext } from '../../../../Components/ThemeProvider';

const StyledProductCard = styled(Box, {
  shouldForwardProp: (prop) => !['isAvailable', 'isFeatured'].includes(prop)
})(({ theme, isAvailable, isFeatured, isDarkMode }) => ({
  height: 180,
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: isDarkMode 
    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: isAvailable ? 1 : 0.6,
  cursor: isAvailable ? 'pointer' : 'not-allowed',
  '&:hover': isAvailable && {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6],
    '& .product-image img': {
      transform: 'scale(1.05)',
    }
  },
  '&:active': isAvailable && {
    transform: 'translateY(-2px)',
  },
  // Featured badge
  ...(isFeatured && {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderWidth: '0 40px 40px 0',
      borderColor: `transparent ${theme.palette.warning.main} transparent transparent`,
      zIndex: 1,
    },
    '&::after': {
      content: '"⭐"',
      position: 'absolute',
      top: 8,
      right: 4,
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 2,
      transform: 'rotate(45deg)',
    }
  })
}));

const ProductImage = styled(Box)(({ theme, hasImage }) => ({
  height: 100,
  width: '100%',
  backgroundColor: hasImage 
    ? 'transparent'
    : (theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9'),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  position: 'relative',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
}));

const ProductInfo = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: 80,
}));

const ProductCard = ({
  product,
  onClick,
  onLongPress,
  compact = false,
  showImage = true,
  showDescription = true
}) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    if (product.is_available !== false) {
      onClick?.(product);
    }
  };

  const handleCardLongPress = () => {
    onLongPress?.(product);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const hasImage = product.image_url && !imageError;
  const isAvailable = product.is_available !== false && product.is_active !== false;
  const isFeatured = product.is_featured || product.featured;

  return (
    <TouchCard
      onClick={handleCardClick}
      onLongPress={handleCardLongPress}
      disabled={!isAvailable}
      minHeight={compact ? 140 : 180}
    >
      <StyledProductCard
        isAvailable={isAvailable}
        isFeatured={isFeatured}
        isDarkMode={isDarkMode}
        display="flex"
        flexDirection="column"
      >
        {/* Product Image */}
        {showImage && (
          <ProductImage hasImage={hasImage} className="product-image">
            {hasImage ? (
              <img
                src={product.image_url}
                alt={product.name}
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <NoImageIcon 
                sx={{ 
                  fontSize: 40, 
                  color: isDarkMode ? '#64748b' : '#94a3b8' 
                }} 
              />
            )}
          </ProductImage>
        )}

        {/* Product Info */}
        <ProductInfo>
          <Box flex={1}>
            <Typography
              variant={compact ? "body2" : "subtitle1"}
              fontWeight="bold"
              color="text.primary"
              gutterBottom={showDescription}
              sx={{
                lineHeight: 1.2,
                height: compact ? 'auto' : '2.4em',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {product.name}
            </Typography>
            
            {showDescription && product.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  lineHeight: 1.3,
                  height: '2.6em',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {product.description}
              </Typography>
            )}
          </Box>

          {/* Price and Badges */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography
                variant={compact ? "body1" : "h6"}
                fontWeight="bold"
                color="primary.main"
                sx={{
                  background: isDarkMode
                    ? 'linear-gradient(45deg, #60a5fa, #90caf9)'
                    : 'linear-gradient(45deg, #1e3a5f, #2c5282)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {formatCurrency(product.price || 0)}
              </Typography>
              
              {product.original_price && product.original_price > product.price && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    textDecoration: 'line-through',
                    fontSize: '0.7rem',
                  }}
                >
                  {formatCurrency(product.original_price)}
                </Typography>
              )}
            </Box>

            <Box display="flex" gap={0.5}>
              {isFeatured && (
                <Chip
                  label="Featured"
                  size="small"
                  icon={<StarIcon />}
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                    color: isDarkMode ? '#fbbf24' : '#d97706',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              )}
              
              {product.category && (
                <Chip
                  label={product.category}
                  size="small"
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.05)',
                    color: isDarkMode ? '#90caf9' : '#1e3a5f',
                    fontWeight: 500,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              )}
              
              {product.collection_type && (
                <Chip
                  label={product.collection_type}
                  size="small"
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 95, 0.2)' : 'rgba(30, 58, 95, 0.05)',
                    color: isDarkMode ? '#90caf9' : '#1e3a5f',
                    fontWeight: 500,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Unavailable Overlay */}
          {!isAvailable && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              backgroundColor="rgba(0, 0, 0, 0.7)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              zIndex={1}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                color="white"
                textAlign="center"
              >
                Unavailable
              </Typography>
            </Box>
          )}
        </ProductInfo>
      </StyledProductCard>
    </TouchCard>
  );
};

export default ProductCard;