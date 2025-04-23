/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Ensure this covers all component files
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Bright blue for primary elements
        'primary-dark': '#2563EB', // Darker shade for hover states
        secondary: '#F8F9FF', // Very light blue-tinted background
        accent: '#FF4D8D', // Vibrant pink accent color to match the image
        neutral: '#2A2B3A', // Dark blue-gray for text
        info: '#64B5F6',    // Lighter blue for informational elements
        success: '#4CAF50', // Green for success messages
        warning: '#FFA726', // Orange for warnings
        danger: '#F44336',  // Red for errors
        light: '#F0F4FF',   // Light blue-tinted background
        dark: '#0F172A',    // Very dark blue background to match the image
      },
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'ui-serif', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins here
  ],
}

