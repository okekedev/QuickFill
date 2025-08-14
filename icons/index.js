import React from 'react';
import Svg, { Path } from 'react-native-svg';

// Hero Icons component
export const HeroIcon = ({ 
  name, 
  size = 24, 
  color = '#374151', 
  strokeWidth = 2,
  fill = 'none',
  style,
  ...props 
}) => {
  const getIconPath = (name) => {
    switch (name) {
      case 'document-text':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'upload':
        return 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12';
      case 'download':
        return 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'pencil':
        return 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z';
      case 'calendar':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'check-square':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'x':
        return 'M6 18L18 6M6 6l12 12';
      case 'check':
        return 'M5 13l4 4L19 7';
      case 'chevron-left':
        return 'M15 19l-7-7 7-7';
      case 'chevron-right':
        return 'M9 5l7 7-7 7';
      case 'chevron-up':
        return 'M19 15l-7-7-7 7';
      case 'chevron-down':
        return 'M5 9l7 7 7-7';
      case 'plus':
        return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
      case 'minus':
        return 'M18 12H6';
      case 'cog':
        return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z';
      case 'zoom-in':
        return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7';
      case 'zoom-out':
        return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7';
      case 'trash':
        return 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16';
      default:
        return 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      style={style}
      {...props}
    >
      <Path
        d={getIconPath(name)}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Predefined icon components for common use cases
export const DocumentIcon = (props) => <HeroIcon name="document-text" {...props} />;
export const UploadIcon = (props) => <HeroIcon name="upload" {...props} />;
export const DownloadIcon = (props) => <HeroIcon name="download" {...props} />;
export const EditIcon = (props) => <HeroIcon name="pencil" {...props} />;
export const CalendarIcon = (props) => <HeroIcon name="calendar" {...props} />;
export const CheckSquareIcon = (props) => <HeroIcon name="check-square" {...props} />;
export const CloseIcon = (props) => <HeroIcon name="x" {...props} />;
export const CheckIcon = (props) => <HeroIcon name="check" {...props} />;
export const ChevronLeftIcon = (props) => <HeroIcon name="chevron-left" {...props} />;
export const ChevronRightIcon = (props) => <HeroIcon name="chevron-right" {...props} />;
export const PlusIcon = (props) => <HeroIcon name="plus" {...props} />;
export const SettingsIcon = (props) => <HeroIcon name="cog" {...props} />;
export const ZoomInIcon = (props) => <HeroIcon name="zoom-in" {...props} />;
export const ZoomOutIcon = (props) => <HeroIcon name="zoom-out" {...props} />;
export const TrashIcon = (props) => <HeroIcon name="trash" {...props} />;