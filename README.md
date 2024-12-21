# Golf Yardage Calculator

A modern golf yardage calculator that takes into account environmental conditions to provide accurate distance calculations.

## Features

- Accurate ball flight physics calculations
- Environmental condition adjustments (temperature, pressure, humidity)
- Wind effect calculations
- Elevation impact calculations
- Modern React-based UI
- TypeScript for type safety
- Comprehensive test coverage

## Infrastructure

The project uses modern development tools and practices:

- **TypeScript** for type safety
- **React** for UI components
- **Express** for backend API
- **Jest** for testing
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **Webpack** for bundling with production optimizations
- **Zod** for runtime type validation

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 9.x or later
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/golf-yardage-calculator.git
cd golf-yardage-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

### Development

Start the development server:
```bash
npm run dev
```

### Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test:coverage
```

### Production Build

Build for production:
```bash
npm run build
```

Analyze bundle size:
```bash
npm run build:analyze
```

### Docker

Build the Docker image:
```bash
npm run docker:build
```

Run the container:
```bash
npm run docker:run
```

## Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: Environment mode ('development', 'production', 'test')
- `PORT`: Server port (default: 3000)
- `API_URL`: External API URL (optional)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 100)
- `JWT_SECRET`: JWT secret key for authentication (optional)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
