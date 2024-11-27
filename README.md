# Pipeline Dig Project Tracker

A comprehensive web application for managing and tracking oil pipeline excavation projects, built with Next.js and Supabase.

## Overview

This enterprise-grade application helps pipeline operators and contractors manage excavation projects by tracking:
- Dig locations and schedules
- AFE (Authorization for Expenditure) management
- GWD (Ground Work Details) tracking
- Permits and compliance requirements
- Purchase orders and vendor management

## Features

- **AFE Management**
  - Create and track multiple AFE projects
  - Monitor budget utilization
  - Link multiple pipelines to AFEs
  - Track project status and completion rates

- **GWD Tracking**
  - Comprehensive dig details management
  - Technical specifications tracking
  - GPS coordinate mapping
  - Inspection data management
  - Progress status monitoring

- **Financial Management**
  - Budget tracking and forecasting
  - Cost analysis and reporting
  - Purchase order management
  - Change order tracking

- **Reporting & Analytics**
  - Real-time dashboard
  - Custom report generation
  - Financial metrics visualization
  - Project status analytics
  - Export capabilities

## Tech Stack

### Core Technologies
- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend and database
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com) - Styling

### Key Libraries
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Lucide React](https://lucide.dev) - Icons
- [date-fns](https://date-fns.org/) - Date manipulation
- [Papa Parse](https://www.papaparse.com/) - CSV parsing
- [XLSX](https://sheetjs.com/) - Excel file handling

## Getting Started

### Prerequisites

- Node.js 18+
- NPM or Yarn
- Supabase account

### Local Development

1. Clone the repository:
```bash
git clone [your-repo-url]
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Update with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

### Deploy to Azure

This application is configured for deployment to Azure Web Apps using GitHub Actions. The deployment workflow includes:

1. Automated builds on push to main branch
2. Environment variable configuration
3. Production deployment with health checks
4. Artifact management

For deployment setup:
1. Configure Azure Web App
2. Set up GitHub repository secrets
3. Configure deployment credentials
4. Enable GitHub Actions workflow

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## Support

For support, please open an issue in the GitHub repository.

## License

Copyright (c) 2024 Codyware

This software is provided under a dual license:

1. For non-commercial and commercial use: This software is freely available for both personal and business use under the following conditions:
   - You may use, modify, and integrate the software into your operations
   - You must provide attribution to the original author
   - You may not resell, relicense, or redistribute the software as a standalone product
   - You may not offer the software as a hosted service (SaaS) without explicit permission
   - All modifications must be shared back to the community under these same terms

2. For resale or SaaS rights: Please contact codydyck@gmail.com for licensing options.

All rights reserved. While this software may be used freely in business operations, the right to resell, relicense, or offer as a service is explicitly reserved by the copyright holder.
