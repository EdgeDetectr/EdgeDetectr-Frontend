# Edge Detectr Frontend

A modern web interface for Edge Detectr, built with Next.js and Tailwind CSS, providing an intuitive way to apply edge detection algorithms to images.

## Features

- Clean, modern UI with responsive design
- Real-time image processing
- Multiple edge detection algorithms
- Image download capabilities
- Progress tracking
- Drag-and-drop file upload
- Mobile-friendly layout

## Prerequisites

- Node.js 18.x
- Docker and Docker Compose (for containerized deployment)

## Project Structure

```
EdgeDetectr-Frontend/
├── app/
│   ├── components/
│   │   ├── image-display.tsx    # Image display component
│   │   ├── image-processor.tsx  # Main processing logic
│   │   ├── image-upload.tsx     # File upload handling
│   │   └── terms-dialog.tsx     # Terms of use dialog
│   ├── layout.tsx              # App layout
│   └── page.tsx               # Main page
├── public/                    # Static assets
├── styles/                    # Global styles
├── Dockerfile                # Container configuration
└── next.config.mjs           # Next.js configuration
```

## Available Edge Detection Operators

- OpenCV Sobel
- Alternative Sobel
- OpenMP Sobel
- Prewitt
- Roberts Cross

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001)
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 3000)

### Environment Setup for Deployment

1. For local development, use the provided `.env.local` file
2. For production deployment:
   - Create a `.env.production` file (not tracked in git)
   - Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
   - Example: `NEXT_PUBLIC_API_URL=http://your-load-balancer-url.amazonaws.com`

**Important:** Never commit your actual production URLs to the git repository. Use the `.env.production.example` as a template.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Docker Deployment

1. Build and start the container:
   ```bash
   docker compose up --build frontend
   ```

2. The application will be available at `http://localhost:3000`

## Responsive Design

The interface adapts to different screen sizes:
- Desktop: Side-by-side image display (≥1024px)
- Mobile/Tablet: Stacked image display (<1024px)
- Consistent image sizing with min/max height constraints
- Centered content with maximum width of 1400px

## Image Processing

1. Select an edge detection operator from the dropdown
2. Upload an image using drag-and-drop or file selection
3. View the original and processed images
4. Download either image using the download buttons

## Browser Compatibility

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS/Android)
