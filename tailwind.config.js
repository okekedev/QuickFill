import gluestackPlugin from '@gluestack-ui/nativewind-utils/tailwind-plugin';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: ["App.{tsx,jsx,ts,js}", "components/**/*.{tsx,jsx,ts,js}"],
  presets: [require('nativewind/preset')],
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(primary|secondary|tertiary|error|success|warning|info|typography|outline|background|indicator)-(0|50|100|200|300|400|500|600|700|800|900|950|white|gray|black|error|warning|muted|success|info|light|dark|primary)/,
    },
    // Add XP/Facebook specific classes to safelist
    {
      pattern: /(btn|card|window|input|nav|toolbar|list|tab|badge|progress|avatar|menu|checkbox|toggle)-(xp|fb)/,
    },
    {
      pattern: /(shadow|gradient|border|transition)-(xp|fb)(-[a-z]+)?/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          0: 'rgb(var(--color-primary-0)/<alpha-value>)',
          50: 'rgb(var(--color-primary-50)/<alpha-value>)',
          100: 'rgb(var(--color-primary-100)/<alpha-value>)',
          200: 'rgb(var(--color-primary-200)/<alpha-value>)',
          300: 'rgb(var(--color-primary-300)/<alpha-value>)',
          400: 'rgb(var(--color-primary-400)/<alpha-value>)',
          500: 'rgb(var(--color-primary-500)/<alpha-value>)',
          600: 'rgb(var(--color-primary-600)/<alpha-value>)',
          700: 'rgb(var(--color-primary-700)/<alpha-value>)',
          800: 'rgb(var(--color-primary-800)/<alpha-value>)',
          900: 'rgb(var(--color-primary-900)/<alpha-value>)',
          950: 'rgb(var(--color-primary-950)/<alpha-value>)',
        },
        secondary: {
          0: 'rgb(var(--color-secondary-0)/<alpha-value>)',
          50: 'rgb(var(--color-secondary-50)/<alpha-value>)',
          100: 'rgb(var(--color-secondary-100)/<alpha-value>)',
          200: 'rgb(var(--color-secondary-200)/<alpha-value>)',
          300: 'rgb(var(--color-secondary-300)/<alpha-value>)',
          400: 'rgb(var(--color-secondary-400)/<alpha-value>)',
          500: 'rgb(var(--color-secondary-500)/<alpha-value>)',
          600: 'rgb(var(--color-secondary-600)/<alpha-value>)',
          700: 'rgb(var(--color-secondary-700)/<alpha-value>)',
          800: 'rgb(var(--color-secondary-800)/<alpha-value>)',
          900: 'rgb(var(--color-secondary-900)/<alpha-value>)',
          950: 'rgb(var(--color-secondary-950)/<alpha-value>)',
        },
        tertiary: {
          50: 'rgb(var(--color-tertiary-50)/<alpha-value>)',
          100: 'rgb(var(--color-tertiary-100)/<alpha-value>)',
          200: 'rgb(var(--color-tertiary-200)/<alpha-value>)',
          300: 'rgb(var(--color-tertiary-300)/<alpha-value>)',
          400: 'rgb(var(--color-tertiary-400)/<alpha-value>)',
          500: 'rgb(var(--color-tertiary-500)/<alpha-value>)',
          600: 'rgb(var(--color-tertiary-600)/<alpha-value>)',
          700: 'rgb(var(--color-tertiary-700)/<alpha-value>)',
          800: 'rgb(var(--color-tertiary-800)/<alpha-value>)',
          900: 'rgb(var(--color-tertiary-900)/<alpha-value>)',
          950: 'rgb(var(--color-tertiary-950)/<alpha-value>)',
        },
        error: {
          0: 'rgb(var(--color-error-0)/<alpha-value>)',
          50: 'rgb(var(--color-error-50)/<alpha-value>)',
          100: 'rgb(var(--color-error-100)/<alpha-value>)',
          200: 'rgb(var(--color-error-200)/<alpha-value>)',
          300: 'rgb(var(--color-error-300)/<alpha-value>)',
          400: 'rgb(var(--color-error-400)/<alpha-value>)',
          500: 'rgb(var(--color-error-500)/<alpha-value>)',
          600: 'rgb(var(--color-error-600)/<alpha-value>)',
          700: 'rgb(var(--color-error-700)/<alpha-value>)',
          800: 'rgb(var(--color-error-800)/<alpha-value>)',
          900: 'rgb(var(--color-error-900)/<alpha-value>)',
          950: 'rgb(var(--color-error-950)/<alpha-value>)',
        },
        success: {
          0: 'rgb(var(--color-success-0)/<alpha-value>)',
          50: 'rgb(var(--color-success-50)/<alpha-value>)',
          100: 'rgb(var(--color-success-100)/<alpha-value>)',
          200: 'rgb(var(--color-success-200)/<alpha-value>)',
          300: 'rgb(var(--color-success-300)/<alpha-value>)',
          400: 'rgb(var(--color-success-400)/<alpha-value>)',
          500: 'rgb(var(--color-success-500)/<alpha-value>)',
          600: 'rgb(var(--color-success-600)/<alpha-value>)',
          700: 'rgb(var(--color-success-700)/<alpha-value>)',
          800: 'rgb(var(--color-success-800)/<alpha-value>)',
          900: 'rgb(var(--color-success-900)/<alpha-value>)',
          950: 'rgb(var(--color-success-950)/<alpha-value>)',
        },
        warning: {
          0: 'rgb(var(--color-warning-0)/<alpha-value>)',
          50: 'rgb(var(--color-warning-50)/<alpha-value>)',
          100: 'rgb(var(--color-warning-100)/<alpha-value>)',
          200: 'rgb(var(--color-warning-200)/<alpha-value>)',
          300: 'rgb(var(--color-warning-300)/<alpha-value>)',
          400: 'rgb(var(--color-warning-400)/<alpha-value>)',
          500: 'rgb(var(--color-warning-500)/<alpha-value>)',
          600: 'rgb(var(--color-warning-600)/<alpha-value>)',
          700: 'rgb(var(--color-warning-700)/<alpha-value>)',
          800: 'rgb(var(--color-warning-800)/<alpha-value>)',
          900: 'rgb(var(--color-warning-900)/<alpha-value>)',
          950: 'rgb(var(--color-warning-950)/<alpha-value>)',
        },
        info: {
          0: 'rgb(var(--color-info-0)/<alpha-value>)',
          50: 'rgb(var(--color-info-50)/<alpha-value>)',
          100: 'rgb(var(--color-info-100)/<alpha-value>)',
          200: 'rgb(var(--color-info-200)/<alpha-value>)',
          300: 'rgb(var(--color-info-300)/<alpha-value>)',
          400: 'rgb(var(--color-info-400)/<alpha-value>)',
          500: 'rgb(var(--color-info-500)/<alpha-value>)',
          600: 'rgb(var(--color-info-600)/<alpha-value>)',
          700: 'rgb(var(--color-info-700)/<alpha-value>)',
          800: 'rgb(var(--color-info-800)/<alpha-value>)',
          900: 'rgb(var(--color-info-900)/<alpha-value>)',
          950: 'rgb(var(--color-info-950)/<alpha-value>)',
        },
        typography: {
          0: 'rgb(var(--color-typography-0)/<alpha-value>)',
          50: 'rgb(var(--color-typography-50)/<alpha-value>)',
          100: 'rgb(var(--color-typography-100)/<alpha-value>)',
          200: 'rgb(var(--color-typography-200)/<alpha-value>)',
          300: 'rgb(var(--color-typography-300)/<alpha-value>)',
          400: 'rgb(var(--color-typography-400)/<alpha-value>)',
          500: 'rgb(var(--color-typography-500)/<alpha-value>)',
          600: 'rgb(var(--color-typography-600)/<alpha-value>)',
          700: 'rgb(var(--color-typography-700)/<alpha-value>)',
          800: 'rgb(var(--color-typography-800)/<alpha-value>)',
          900: 'rgb(var(--color-typography-900)/<alpha-value>)',
          950: 'rgb(var(--color-typography-950)/<alpha-value>)',
          white: '#FFFFFF',
          gray: '#D4D4D4',
          black: '#181718',
        },
        outline: {
          0: 'rgb(var(--color-outline-0)/<alpha-value>)',
          50: 'rgb(var(--color-outline-50)/<alpha-value>)',
          100: 'rgb(var(--color-outline-100)/<alpha-value>)',
          200: 'rgb(var(--color-outline-200)/<alpha-value>)',
          300: 'rgb(var(--color-outline-300)/<alpha-value>)',
          400: 'rgb(var(--color-outline-400)/<alpha-value>)',
          500: 'rgb(var(--color-outline-500)/<alpha-value>)',
          600: 'rgb(var(--color-outline-600)/<alpha-value>)',
          700: 'rgb(var(--color-outline-700)/<alpha-value>)',
          800: 'rgb(var(--color-outline-800)/<alpha-value>)',
          900: 'rgb(var(--color-outline-900)/<alpha-value>)',
          950: 'rgb(var(--color-outline-950)/<alpha-value>)',
        },
        background: {
          0: 'rgb(var(--color-background-0)/<alpha-value>)',
          50: 'rgb(var(--color-background-50)/<alpha-value>)',
          100: 'rgb(var(--color-background-100)/<alpha-value>)',
          200: 'rgb(var(--color-background-200)/<alpha-value>)',
          300: 'rgb(var(--color-background-300)/<alpha-value>)',
          400: 'rgb(var(--color-background-400)/<alpha-value>)',
          500: 'rgb(var(--color-background-500)/<alpha-value>)',
          600: 'rgb(var(--color-background-600)/<alpha-value>)',
          700: 'rgb(var(--color-background-700)/<alpha-value>)',
          800: 'rgb(var(--color-background-800)/<alpha-value>)',
          900: 'rgb(var(--color-background-900)/<alpha-value>)',
          950: 'rgb(var(--color-background-950)/<alpha-value>)',
          error: 'rgb(var(--color-background-error)/<alpha-value>)',
          warning: 'rgb(var(--color-background-warning)/<alpha-value>)',
          success: 'rgb(var(--color-background-success)/<alpha-value>)',
          muted: 'rgb(var(--color-background-muted)/<alpha-value>)',
          info: 'rgb(var(--color-background-info)/<alpha-value>)',
        },
        indicator: {
          primary: 'rgb(var(--color-indicator-primary)/<alpha-value>)',
          info: 'rgb(var(--color-indicator-info)/<alpha-value>)',
          error: 'rgb(var(--color-indicator-error)/<alpha-value>)',
        },
      },
      fontFamily: {
        // Windows XP system fonts
        'xp': ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        'xp-mono': ['Consolas', 'Courier New', 'monospace'],
        // Facebook fonts  
        'fb': ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // XP-inspired font sizes
        'xp-xs': ['11px', { lineHeight: '16px' }],
        'xp-sm': ['12px', { lineHeight: '18px' }],
        'xp-base': ['13px', { lineHeight: '20px' }],
        'xp-lg': ['14px', { lineHeight: '22px' }],
        'xp-xl': ['16px', { lineHeight: '24px' }],
      },
      spacing: {
        // XP-inspired spacing (based on 4px grid)
        'xp-1': '2px',
        'xp-2': '4px', 
        'xp-3': '6px',
        'xp-4': '8px',
        'xp-5': '10px',
        'xp-6': '12px',
        'xp-8': '16px',
        'xp-10': '20px',
        'xp-12': '24px',
      },
      borderRadius: {
        // XP typically used minimal rounding
        'xp': '2px',
        'xp-sm': '1px',
        'xp-md': '3px',
        'xp-lg': '4px',
        // Facebook uses more modern rounding
        'fb': '8px',
        'fb-sm': '6px',
        'fb-md': '10px',
        'fb-lg': '12px',
        'fb-xl': '16px',
      },
      boxShadow: {
        // XP-style shadows
        'xp-window': '2px 2px 8px rgba(0, 0, 0, 0.3)',
        'xp-button': '1px 1px 3px rgba(0, 0, 0, 0.2)',
        'xp-inset': 'inset 1px 1px 0 rgba(255, 255, 255, 0.8), inset -1px -1px 0 rgba(0, 0, 0, 0.2)',
        'xp-sunken': 'inset 1px 1px 2px rgba(0, 0, 0, 0.3)',
        
        // Facebook-style shadows
        'fb-card': '0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
        'fb-hover': '0 4px 8px rgba(0, 0, 0, 0.12), 0 12px 20px rgba(0, 0, 0, 0.15)',
        'fb-button': '0 1px 2px rgba(0, 0, 0, 0.1)',
        'fb-nav': '0 2px 4px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        // XP-inspired animations
        'xp-fadeIn': 'xpFadeIn 0.3s ease-out',
        'xp-slideDown': 'xpSlideDown 0.2s ease-out',
        'xp-hover': 'xpHover 0.15s ease-out',
        
        // Facebook-inspired animations
        'fb-slideUp': 'fbSlideUp 0.3s ease-out',
        'fb-scaleIn': 'fbScaleIn 0.2s ease-out',
        'fb-bounce': 'fbBounce 0.4s ease-out',
        'fb-pulse': 'fbPulse 2s infinite',
        
        // Shared animations
        'smooth-pulse': 'smoothPulse 1.5s ease-in-out infinite',
        'gentle-bounce': 'gentleBounce 0.6s ease-out',
      },
      keyframes: {
        // XP-style animations
        xpFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        xpSlideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        xpHover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-1px)' },
        },
        
        // Facebook-style animations
        fbSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fbScaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fbBounce: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
          '40%, 43%': { transform: 'translateY(-4px)' },
          '70%': { transform: 'translateY(-2px)' },
          '90%': { transform: 'translateY(-1px)' },
        },
        fbPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        
        // Shared animations
        smoothPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        gentleBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
      },
      backdropBlur: {
        'xp': '2px',
        'fb': '10px',
      },
      transitionTimingFunction: {
        'xp': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'fb': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'xp': '200ms',
        'fb': '150ms',
      },
      zIndex: {
        'xp-tooltip': '1000',
        'xp-dropdown': '1010',
        'xp-modal': '1020',
        'xp-taskbar': '1030',
      },
    },
  },
  plugins: [
    gluestackPlugin,
    // Custom plugin for XP/Facebook specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // XP Button states
        '.btn-xp-pressed': {
          transform: 'translateY(1px)',
          boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.3)',
        },
        
        // Facebook interaction states
        '.fb-interactive': {
          transition: 'all 0.15s ease-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.fb-hover'),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        
        // Glass morphism utilities
        '.glass-xp': {
          backdropFilter: 'blur(2px)',
          background: 'rgba(248, 250, 252, 0.8)',
          border: '1px solid rgba(203, 213, 225, 0.5)',
        },
        
        '.glass-fb': {
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        
        // Text utilities
        '.text-xp-shadow': {
          textShadow: '0 1px 0 rgba(0, 0, 0, 0.3)',
        },
        
        '.text-fb-weight': {
          fontWeight: '600',
          letterSpacing: '-0.01em',
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
};