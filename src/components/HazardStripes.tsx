import React from 'react';

interface HazardStripesProps {
  className?: string;
  height?: string;
}

export const HazardStripes: React.FC<HazardStripesProps> = ({ 
  className = '', 
  height = 'h-3' 
}) => {
  return (
    <div 
      className={`w-full overflow-hidden ${height} ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          #18181B,
          #18181B 12px,
          #F59E0B 12px,
          #F59E0B 24px
        )`,
      }}
      role="presentation"
      aria-hidden="true"
    />
  );
};
