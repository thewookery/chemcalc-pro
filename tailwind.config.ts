
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))', // Use CSS variable for input border
        'input-foreground': 'hsl(var(--input-foreground))', // Use CSS variable for input text
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0px)', opacity: '1' },
        },
        iconFloat: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '12.5%': { transform: 'translate(2px, -3px) rotate(-2deg)' },
          '25%': { transform: 'translate(0px, -5px) rotate(0deg)' },
          '37.5%': { transform: 'translate(-2px, -3px) rotate(2deg)' },
          '50%': { transform: 'translate(-3px, 0px) rotate(0deg)' },
          '62.5%': { transform: 'translate(-2px, 3px) rotate(-2deg)' },
          '75%': { transform: 'translate(0px, 5px) rotate(0deg)' },
          '87.5%': { transform: 'translate(2px, 3px) rotate(2deg)' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)' },
        },
        rainbowFade: {
          '0%, 100%': { color: 'hsl(0, 100%, 60%)' },   /* Red */
          '16%': { color: 'hsl(45, 100%, 60%)' },     /* Orange */
          '32%': { color: 'hsl(60, 100%, 60%)' },     /* Yellow */
          '48%': { color: 'hsl(120, 100%, 60%)' },    /* Green */
          '64%': { color: 'hsl(240, 100%, 60%)' },    /* Blue */
          '80%': { color: 'hsl(280, 100%, 60%)' },    /* Purple */
        },
        glitchEffect: {
          '0%, 100%': { transform: 'translate(0, 0) skew(0deg)', opacity: '1' },
          '10%': { transform: 'translate(-3px, 2px) skew(-3deg)', opacity: '0.85' },
          '20%': { transform: 'translate(2px, -3px) skew(4deg)', opacity: '1' },
          '30%': { transform: 'translate(3px, 3px) skew(0deg)', opacity: '0.9' },
          '40%': { transform: 'translate(-2px, -2px) skew(-2deg)', opacity: '1' },
          '50%': { transform: 'translate(0, 0) skew(0deg)', opacity: '0.75' },
          '60%': { transform: 'translate(-3px, 3px) skew(3deg)', opacity: '1' },
          '70%': { transform: 'translate(2px, -2px) skew(-4deg)', opacity: '0.9' },
          '80%': { transform: 'translate(0, 0) skew(0deg)', opacity: '1' },
          '90%': { transform: 'translate(-2px, 2px) skew(2deg)', opacity: '0.95' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideUp: 'slideUp 0.5s ease-in-out',
        'icon-float': 'iconFloat 100s infinite ease-in-out',
        'rainbow-fade': 'rainbowFade 15s infinite linear',
        'glitch': 'glitchEffect 0.25s linear 1 forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
