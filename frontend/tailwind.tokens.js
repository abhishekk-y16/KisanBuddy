/**
 * Design tokens exported for tailwind.config.js
 * Keep this file small and focused — used to extend theme.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        interactive: {
          DEFAULT: '#0B66FF',
          600: '#0848C8',
          400: '#2B82FF'
        },
        surface: {
          50: '#FAFBFF',
          100: '#F4F6FB',
          200: '#EBEFF8'
        },
        danger: '#EF4444',
        success: '#16A34A',
        warn: '#F59E0B'
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px'
      },
      fontSize: {
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px'
      }
    }
  }
};
// Tailwind token mapping generated from design-tokens.json
const tokens = require('./design-tokens.json');

module.exports = {
  theme: {
    extend: {
      colors: {
        'elite-900': tokens.color.bg, // fallback mapping
        'accent-start': tokens.color.accentGradientStart,
        'accent-end': tokens.color.accentGradientEnd,
        success: tokens.color.success,
        warning: tokens.color.warning,
        danger: tokens.color.danger,
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      spacing: {
        'page-gutter': tokens.spacing.pageGutter,
      },
      boxShadow: {
        sm: tokens.elevation.sm,
        md: tokens.elevation.md,
      },
      transitionTimingFunction: {
        'premium': tokens.motion.easeInOut,
      },
      transitionDuration: {
        short: tokens.motion.durationShort.replace('ms',''),
        base: tokens.motion.duration.replace('ms',''),
        long: tokens.motion.durationLong.replace('ms',''),
      }
    }
  }
}
