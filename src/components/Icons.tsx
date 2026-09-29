import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const CloseIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={className}>
    <line x1="3" y1="3" x2="13" y2="13" />
    <line x1="13" y1="3" x2="3" y2="13" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 4h11" />
    <path d="M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4" />
    <path d="M4 4l.8 9.2a1 1 0 001 .8h4.4a1 1 0 001-.8L12 4" />
  </svg>
);

export const EditIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 2.5l2.5 2.5-8.5 8.5H2.5v-2.5L11 2.5z" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 8.5 6.5 12 13 4.5" />
  </svg>
);

export const AlertIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="8 2 14.5 13.5 1.5 13.5 8 2" />
    <line x1="8" y1="6.5" x2="8" y2="9.5" />
    <circle cx="8" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

export const DatabaseIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="8" cy="3.5" rx="6" ry="2" />
    <path d="M2 3.5v4.5c0 1.1 2.7 2 6 2s6-.9 6-2V3.5" />
    <path d="M2 8v4.5c0 1.1 2.7 2 6 2s6-.9 6-2V8" />
  </svg>
);
