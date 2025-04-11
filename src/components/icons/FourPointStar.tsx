import React from 'react';

interface FourPointStarProps {
  className?: string;
  fill?: string;
}

const FourPointStar: React.FC<FourPointStarProps> = ({ className = "w-6 h-6", fill = "currentColor" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill={fill}
      className={className}
    >
      <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
    </svg>
  );
};

export default FourPointStar;
