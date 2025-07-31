/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px', // Extra small screens
        'xxs': '375px', // Ultra small smartphones (iPhone SE, small Android)
        'mobile': '414px', // Standard smartphone size
        'mobile-lg': '480px', // Large smartphones
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        'mobile-safe': '1rem', // Safe area for mobile notches
      },
      maxWidth: {
        'xxs': '16rem',
        'mobile': '100vw',
      },
      minHeight: {
        'touch': '44px', // Minimum touch target size
        'touch-lg': '48px', // Large touch target
      },
      fontSize: {
        'mobile-xs': ['0.6875rem', { lineHeight: '1rem' }],
        'mobile-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'mobile-base': ['0.9375rem', { lineHeight: '1.375rem' }],
      },
      borderRadius: {
        'mobile': '12px',
        'mobile-lg': '16px',
      }
    },
  },
  plugins: [],
}
