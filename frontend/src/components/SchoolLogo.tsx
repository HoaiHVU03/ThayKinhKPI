// frontend/src/components/SchoolLogo.tsx
// Component hiển thị Logo / Huy hiệu trường học riêng biệt 100% cho từng trường

import React from 'react';

interface SchoolLogoProps {
  schoolCode?: string;
  schoolName?: string;
  logoUrl?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12 sm:w-16 sm:h-16',
  xl: 'w-20 h-20',
};

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  schoolCode = 'chuyenhungvuong',
  schoolName = 'Trường THPT Chuyên Hùng Vương',
  logoUrl,
  className = '',
  size = 'md',
}) => {
  const code = (schoolCode || '').toLowerCase().trim();
  const name = (schoolName || '').toLowerCase();

  // 1. Trường THPT Chuyên Hùng Vương -> Huy hiệu truyền thống Chuyên Hùng Vương
  if (
    code === 'chuyenhungvuong' ||
    code === 'hungvuong' ||
    code === 'default' ||
    name.includes('hùng vương')
  ) {
    return (
      <img
        src="/logo.png"
        alt={schoolName}
        className={`${sizeClasses[size]} object-contain ${className}`}
      />
    );
  }

  // 2. Trường THPT Phù Ninh -> Huy hiệu riêng biệt Phù Ninh (Emerald & Navy, Est. 1965)
  if (code === 'phuninh' || name.includes('phù ninh')) {
    return (
      <img
        src="/logos/phuninh.svg"
        alt={schoolName}
        className={`${sizeClasses[size]} object-contain ${className}`}
      />
    );
  }

  // 3. Trường THPT Việt Trì -> Huy hiệu riêng biệt Việt Trì (Red & Gold Trống Đồng, Est. 1962)
  if (code === 'viettri' || name.includes('việt trì')) {
    return (
      <img
        src="/logos/viettri.svg"
        alt={schoolName}
        className={`${sizeClasses[size]} object-contain ${className}`}
      />
    );
  }

  // 4. Nếu có file ảnh logo tùy chỉnh được nạp vào
  if (logoUrl && !logoUrl.endsWith('/logo.png')) {
    return (
      <img
        src={logoUrl}
        alt={schoolName}
        className={`${sizeClasses[size]} object-contain ${className}`}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // 5. Huy hiệu sinh tự động (Bespoke Heraldic Seal) riêng biệt cho từng trường mới
  const cleanName = schoolName.replace(/Trường|THPT|Chuyên|-/gi, '').trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : (cleanName.slice(0, 2).toUpperCase() || 'TH');

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${sizeClasses[size]} object-contain shrink-0 drop-shadow-xs ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`grad_${code || 'generic'}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0B1329" />
        </linearGradient>
      </defs>
      {/* Outer Ring */}
      <circle cx="50" cy="50" r="47" fill={`url(#grad_${code || 'generic'})`} stroke="#F59E0B" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#FDE68A" strokeWidth="0.8" strokeDasharray="2.5 1.5" />
      
      {/* Torch of Knowledge */}
      <path d="M 50,18 C 46,24 48,29 50,32 C 52,29 54,24 50,18 Z" fill="#EF4444" />
      <path d="M 50,21 C 48,25 49,28 50,30 C 51,28 52,25 50,21 Z" fill="#FBBF24" />
      <path d="M 48,32 L 52,32 L 51,37 L 49,37 Z" fill="#94A3B8" />

      {/* School Initials */}
      <text
        x="50"
        y="56"
        fontFamily="'Inter', 'Roboto', 'Arial', sans-serif"
        fontSize="17"
        fontWeight="900"
        fill="#FFFFFF"
        textAnchor="middle"
        letterSpacing="1"
      >
        {initials}
      </text>

      {/* Ribbon Banner */}
      <rect x="24" y="64" width="52" height="13" rx="3.5" fill="#B91C1C" stroke="#F59E0B" strokeWidth="0.8" />
      <text
        x="50"
        y="73.5"
        fontFamily="'Inter', 'Arial', sans-serif"
        fontSize="7.5"
        fontWeight="900"
        fill="#FFFFFF"
        textAnchor="middle"
        letterSpacing="0.8"
      >
        THPT
      </text>
    </svg>
  );
};
