# Tailwind CSS Setup

This project uses Tailwind CSS for styling. Here's how the setup works:

## Files

- `global.css`: Contains the Tailwind directives and custom styles using @layer
- `output.css`: The compiled CSS file generated from Tailwind (don't edit this directly)
- `tailwind.config.js`: Configuration for Tailwind, including theme extensions and plugins

## Build Process

The `build:tailwind` script in package.json runs the `build-tailwind.js` file, which:
1. Takes `src/global.css` as input
2. Processes it through Tailwind CSS
3. Outputs the compiled CSS to `src/styles/output.css`

## Usage

- Import the compiled CSS in your application: `import './styles/output.css'`
- Use Tailwind utility classes directly in your JSX/HTML
- Add custom styles using @layer in global.css

## Plugins

This project uses the following Tailwind plugins:
- @tailwindcss/forms
- @tailwindcss/typography
- @tailwindcss/aspect-ratio

## Commands

- `npm run build:tailwind`: Build the CSS only
- `npm run start`: Builds the CSS and starts the development server
- `npm run build`: Builds the CSS and the entire application for production
