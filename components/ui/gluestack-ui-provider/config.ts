// components/ui/gluestack-ui-provider/config.ts
'use client';
import { vars } from 'nativewind';

export const config = {
  light: vars({
    // Windows Logo Blue - Classic XP taskbar and window chrome
    '--color-primary-0': '219 237 255',     // Lightest Windows blue
    '--color-primary-50': '196 228 255',    // Very light blue
    '--color-primary-100': '173 216 255',   // Light blue
    '--color-primary-200': '127 185 255',   // Medium light blue
    '--color-primary-300': '81 154 255',    // Medium blue
    '--color-primary-400': '35 123 255',    // Classic Windows blue
    '--color-primary-500': '0 100 234',     // Core Windows blue (#0064EA)
    '--color-primary-600': '0 85 200',      // Darker blue
    '--color-primary-700': '0 70 167',      // Dark blue
    '--color-primary-800': '0 55 134',      // Very dark blue
    '--color-primary-900': '0 40 100',      // Darkest blue
    '--color-primary-950': '0 30 75',       // Ultra dark blue

    // Windows Logo Red - Vibrant red from Windows logo
    '--color-secondary-0': '255 245 245',   // Lightest red
    '--color-secondary-50': '255 235 235',  // Very light red
    '--color-secondary-100': '255 215 215', // Light red
    '--color-secondary-200': '255 175 175', // Medium light red
    '--color-secondary-300': '255 135 135', // Medium red
    '--color-secondary-400': '255 95 95',   // Bright red
    '--color-secondary-500': '240 68 56',   // Core Windows red (#F04438)
    '--color-secondary-600': '220 38 38',   // Darker red
    '--color-secondary-700': '185 28 28',   // Dark red
    '--color-secondary-800': '153 27 27',   // Very dark red
    '--color-secondary-900': '127 29 29',   // Darkest red
    '--color-secondary-950': '83 19 19',    // Ultra dark red

    // Windows Logo Green - Fresh green from Windows logo
    '--color-tertiary-0': '240 253 244',    // Lightest green
    '--color-tertiary-50': '220 252 231',   // Very light green
    '--color-tertiary-100': '187 247 208',  // Light green
    '--color-tertiary-200': '134 239 172',  // Medium light green
    '--color-tertiary-300': '74 222 128',   // Medium green
    '--color-tertiary-400': '34 197 94',    // Bright green
    '--color-tertiary-500': '16 185 129',   // Core Windows green (#10B981)
    '--color-tertiary-600': '5 150 105',    // Darker green
    '--color-tertiary-700': '4 120 87',     // Dark green
    '--color-tertiary-800': '6 78 59',      // Very dark green
    '--color-tertiary-900': '6 64 50',      // Darkest green
    '--color-tertiary-950': '2 44 34',      // Ultra dark green

    // Error Red - Windows error red
    '--color-error-0': '255 242 242',       // Lightest error red
    '--color-error-50': '255 230 230',      // Very light error red
    '--color-error-100': '255 205 210',     // Light error red
    '--color-error-200': '255 159 170',     // Medium light error red
    '--color-error-300': '255 107 129',     // Medium error red
    '--color-error-400': '255 59 92',       // Bright error red
    '--color-error-500': '239 68 68',       // Core error red
    '--color-error-600': '220 38 38',       // Standard error red
    '--color-error-700': '185 28 28',       // Dark error red
    '--color-error-800': '153 27 27',       // Very dark error red
    '--color-error-900': '127 29 29',       // Darkest error red
    '--color-error-950': '83 19 19',        // Ultra dark error red

    // Success Green - Windows success green
    '--color-success-0': '236 253 245',     // Lightest success
    '--color-success-50': '209 250 229',    // Very light success
    '--color-success-100': '167 243 208',   // Light success
    '--color-success-200': '110 231 183',   // Medium light success
    '--color-success-300': '52 211 153',    // Medium success
    '--color-success-400': '16 185 129',    // Bright success
    '--color-success-500': '5 150 105',     // Core success
    '--color-success-600': '4 120 87',      // Standard success green
    '--color-success-700': '6 95 70',       // Dark success
    '--color-success-800': '6 78 59',       // Very dark success
    '--color-success-900': '6 64 50',       // Darkest success
    '--color-success-950': '2 44 34',       // Ultra dark success

    // Windows Logo Orange - Vibrant orange from Windows logo
    '--color-warning-0': '255 251 235',     // Lightest orange
    '--color-warning-50': '255 247 220',    // Very light orange
    '--color-warning-100': '255 237 185',   // Light orange
    '--color-warning-200': '255 217 115',   // Medium light orange
    '--color-warning-300': '255 191 65',    // Medium orange
    '--color-warning-400': '255 165 25',    // Bright orange
    '--color-warning-500': '251 146 60',    // Core Windows orange (#FB923C)
    '--color-warning-600': '234 119 20',    // Darker orange
    '--color-warning-700': '196 99 16',     // Dark orange
    '--color-warning-800': '158 79 13',     // Very dark orange
    '--color-warning-900': '120 63 15',     // Darkest orange
    '--color-warning-950': '82 43 10',      // Ultra dark orange

    // Windows Logo Yellow - Bright yellow from Windows logo
    '--color-info-0': '255 255 240',        // Lightest yellow
    '--color-info-50': '255 255 220',       // Very light yellow
    '--color-info-100': '255 255 185',      // Light yellow
    '--color-info-200': '255 245 135',      // Medium light yellow
    '--color-info-300': '255 235 85',       // Medium yellow
    '--color-info-400': '255 225 35',       // Bright yellow
    '--color-info-500': '251 191 36',       // Core Windows yellow (#FBBF24)
    '--color-info-600': '245 158 11',       // Darker yellow
    '--color-info-700': '217 119 6',        // Dark yellow
    '--color-info-800': '180 83 9',         // Very dark yellow
    '--color-info-900': '146 64 14',        // Darkest yellow
    '--color-info-950': '120 53 15',        // Ultra dark yellow

    // Typography - XP inspired with modern contrast
    '--color-typography-0': '255 255 255',  // White text
    '--color-typography-50': '248 250 252', // Near white
    '--color-typography-100': '241 245 249', // Very light
    '--color-typography-200': '226 232 240', // Light
    '--color-typography-300': '203 213 225', // Medium light
    '--color-typography-400': '148 163 184', // Medium
    '--color-typography-500': '100 116 139', // Core text
    '--color-typography-600': '71 85 105',   // Dark text
    '--color-typography-700': '51 65 85',    // Very dark text
    '--color-typography-800': '30 41 59',    // XP dark text
    '--color-typography-900': '15 23 42',    // Darkest text
    '--color-typography-950': '2 6 23',      // Ultra dark text
    '--color-typography-white': '#FFFFFF',
    '--color-typography-gray': '#6B7280',
    '--color-typography-black': '#111827',

    // Outline/Border - XP window border inspired
    '--color-outline-0': '255 255 255',     // White outline
    '--color-outline-50': '248 250 252',    // Very light outline
    '--color-outline-100': '241 245 249',   // Light outline
    '--color-outline-200': '226 232 240',   // XP light border
    '--color-outline-300': '203 213 225',   // Medium light outline
    '--color-outline-400': '148 163 184',   // Medium outline
    '--color-outline-500': '100 116 139',   // Core outline
    '--color-outline-600': '71 85 105',     // XP medium border
    '--color-outline-700': '51 65 85',      // Dark outline
    '--color-outline-800': '30 41 59',      // Very dark outline
    '--color-outline-900': '15 23 42',      // XP dark border
    '--color-outline-950': '2 6 23',        // Ultra dark outline

    // Background - XP Luna theme inspired
    '--color-background-0': '255 255 255',  // Pure white
    '--color-background-50': '248 250 252', // XP window background
    '--color-background-100': '241 245 249', // Very light background
    '--color-background-200': '226 232 240', // Light background
    '--color-background-300': '203 213 225', // Medium light background
    '--color-background-400': '148 163 184', // Medium background
    '--color-background-500': '100 116 139', // Core background
    '--color-background-600': '71 85 105',  // Dark background
    '--color-background-700': '51 65 85',   // Very dark background
    '--color-background-800': '30 41 59',   // XP dark background
    '--color-background-900': '15 23 42',   // Darkest background
    '--color-background-950': '2 6 23',     // Ultra dark background

    // Special Backgrounds - XP/Facebook inspired
    '--color-background-error': '254 242 242',    // Light error background
    '--color-background-warning': '255 251 235',  // Light warning background
    '--color-background-success': '240 253 244',  // Light success background
    '--color-background-muted': '248 250 252',    // XP muted background
    '--color-background-info': '240 249 255',     // Light info background

    // Focus Ring Indicators - XP blue focus
    '--color-indicator-primary': '0 100 234',     // XP blue focus
    '--color-indicator-info': '2 132 199',        // Info focus
    '--color-indicator-error': '220 38 38',       // Error focus
  }),

  dark: vars({
    // Dark mode - Modern dark with XP accent colors
    '--color-primary-0': '219 237 255',     // Light XP blue (preserved)
    '--color-primary-50': '196 228 255',    // 
    '--color-primary-100': '173 216 255',   // 
    '--color-primary-200': '127 185 255',   // 
    '--color-primary-300': '81 154 255',    // 
    '--color-primary-400': '35 123 255',    // Classic XP blue
    '--color-primary-500': '0 100 234',     // Core XP blue
    '--color-primary-600': '0 85 200',      // 
    '--color-primary-700': '0 70 167',      // 
    '--color-primary-800': '0 55 134',      // 
    '--color-primary-900': '0 40 100',      // 
    '--color-primary-950': '0 30 75',       // 

    // Dark Secondary - Facebook dark mode grays
    '--color-secondary-0': '24 25 31',      // Facebook darkest
    '--color-secondary-50': '29 33 41',     // Very dark
    '--color-secondary-100': '42 56 79',    // Dark
    '--color-secondary-200': '66 82 110',   // Medium dark
    '--color-secondary-300': '96 103 112',  // Medium
    '--color-secondary-400': '144 147 153', // Medium light
    '--color-secondary-500': '176 179 184', // Light
    '--color-secondary-600': '208 212 220', // Very light
    '--color-secondary-700': '228 230 235', // 
    '--color-secondary-800': '244 245 247', // 
    '--color-secondary-900': '250 250 251', // 
    '--color-secondary-950': '255 255 255', // White

    // Dark Tertiary - Maintained green spectrum
    '--color-tertiary-0': '14 41 32',       // Dark green
    '--color-tertiary-50': '20 58 43',      // 
    '--color-tertiary-100': '22 71 48',     // 
    '--color-tertiary-200': '20 83 45',     // 
    '--color-tertiary-300': '21 128 61',    // 
    '--color-tertiary-400': '22 163 74',    // 
    '--color-tertiary-500': '34 197 94',    // 
    '--color-tertiary-600': '74 222 128',   // 
    '--color-tertiary-700': '134 239 172',  // 
    '--color-tertiary-800': '187 247 208',  // 
    '--color-tertiary-900': '220 252 231',  // 
    '--color-tertiary-950': '240 253 244',  // 

    // Dark Error - Red spectrum
    '--color-error-0': '83 19 19',          // Dark red
    '--color-error-50': '127 29 29',        // 
    '--color-error-100': '153 27 27',       // 
    '--color-error-200': '185 28 28',       // 
    '--color-error-300': '220 38 38',       // 
    '--color-error-400': '239 68 68',       // 
    '--color-error-500': '255 59 92',       // 
    '--color-error-600': '255 107 129',     // 
    '--color-error-700': '255 159 170',     // 
    '--color-error-800': '255 205 210',     // 
    '--color-error-900': '255 228 230',     // 
    '--color-error-950': '255 241 242',     // 

    // Dark Success
    '--color-success-0': '2 44 34',         // Dark success
    '--color-success-50': '6 64 50',        // 
    '--color-success-100': '6 78 59',       // 
    '--color-success-200': '6 95 70',       // 
    '--color-success-300': '4 120 87',      // 
    '--color-success-400': '5 150 105',     // 
    '--color-success-500': '16 185 129',    // 
    '--color-success-600': '52 211 153',    // 
    '--color-success-700': '110 231 183',   // 
    '--color-success-800': '167 243 208',   // 
    '--color-success-900': '209 250 229',   // 
    '--color-success-950': '236 253 245',   // 

    // Dark Warning
    '--color-warning-0': '69 26 3',         // Dark warning
    '--color-warning-50': '99 49 18',       // 
    '--color-warning-100': '120 53 15',     // 
    '--color-warning-200': '146 64 14',     // 
    '--color-warning-300': '180 83 9',      // 
    '--color-warning-400': '217 119 6',     // 
    '--color-warning-500': '245 158 11',    // 
    '--color-warning-600': '251 191 36',    // 
    '--color-warning-700': '252 211 77',    // 
    '--color-warning-800': '253 230 138',   // 
    '--color-warning-900': '254 243 199',   // 
    '--color-warning-950': '255 251 235',   // 

    // Dark Info
    '--color-info-0': '8 47 73',            // Dark info
    '--color-info-50': '12 74 110',         // 
    '--color-info-100': '7 89 133',         // 
    '--color-info-200': '3 105 161',        // 
    '--color-info-300': '2 119 189',        // 
    '--color-info-400': '2 132 199',        // 
    '--color-info-500': '14 165 233',       // 
    '--color-info-600': '56 189 248',       // 
    '--color-info-700': '125 211 252',      // 
    '--color-info-800': '186 230 253',      // 
    '--color-info-900': '224 242 254',      // 
    '--color-info-950': '240 249 255',      // 

    // Dark Typography
    '--color-typography-0': '2 6 23',       // Dark text
    '--color-typography-50': '15 23 42',    // 
    '--color-typography-100': '30 41 59',   // 
    '--color-typography-200': '51 65 85',   // 
    '--color-typography-300': '71 85 105',  // 
    '--color-typography-400': '100 116 139', // 
    '--color-typography-500': '148 163 184', // 
    '--color-typography-600': '203 213 225', // 
    '--color-typography-700': '226 232 240', // 
    '--color-typography-800': '241 245 249', // 
    '--color-typography-900': '248 250 252', // 
    '--color-typography-950': '255 255 255', // 
    '--color-typography-white': '#FFFFFF',
    '--color-typography-gray': '#9CA3AF',
    '--color-typography-black': '#F9FAFB',

    // Dark Outline
    '--color-outline-0': '2 6 23',          // Dark outline
    '--color-outline-50': '15 23 42',       // 
    '--color-outline-100': '30 41 59',      // 
    '--color-outline-200': '51 65 85',      // 
    '--color-outline-300': '71 85 105',     // 
    '--color-outline-400': '100 116 139',   // 
    '--color-outline-500': '148 163 184',   // 
    '--color-outline-600': '203 213 225',   // 
    '--color-outline-700': '226 232 240',   // 
    '--color-outline-800': '241 245 249',   // 
    '--color-outline-900': '248 250 252',   // 
    '--color-outline-950': '255 255 255',   // 

    // Dark Background
    '--color-background-0': '2 6 23',       // Ultra dark
    '--color-background-50': '15 23 42',    // Very dark
    '--color-background-100': '30 41 59',   // Dark
    '--color-background-200': '51 65 85',   // Medium dark
    '--color-background-300': '71 85 105',  // Medium
    '--color-background-400': '100 116 139', // Medium light
    '--color-background-500': '148 163 184', // Light
    '--color-background-600': '203 213 225', // Very light
    '--color-background-700': '226 232 240', // 
    '--color-background-800': '241 245 249', // 
    '--color-background-900': '248 250 252', // 
    '--color-background-950': '255 255 255', // White

    // Dark Special Backgrounds
    '--color-background-error': '83 19 19',     // Dark error background
    '--color-background-warning': '69 26 3',   // Dark warning background
    '--color-background-success': '2 44 34',   // Dark success background
    '--color-background-muted': '30 41 59',    // Dark muted background
    '--color-background-info': '8 47 73',      // Dark info background

    // Dark Focus Indicators
    '--color-indicator-primary': '0 100 234',  // XP blue focus
    '--color-indicator-info': '2 132 199',     // Info focus
    '--color-indicator-error': '239 68 68',    // Error focus
  }),
};