# Directus ERP
 
A flexible ERP and back-office system built on Directus.
 
This project provides a scalable foundation for managing business operations, internal workflows, customer data, and process-driven administration through a modern, API-first platform.
 
## Overview
 
Directus ERP is designed for businesses that need a customizable internal system without building every admin feature from scratch.
 
By using Directus as the core platform, the system combines a powerful admin interface, structured data management, role-based access control, financial transactions and reports, with API connectivity in one solution.
 
It can be adapted to different business models, internal processes, and operational workflows.

## Installation

### Via Directus Marketplace

1. Go to **Settings → Extensions**
2. Search for "Mini ERP"
3. Click **Install**

### Manual Installation

```bash
npm install @ashszoftverhaz/directus-extension-mini-erp
```

And copy the `dist` folder and package.json file to your Directus extensions directory:
```
extensions/directus-extension-mini-erp/
├── dist/
│   └── api.js
│   └── app.js
└── package.json
```

Restart Directus after installation.
 
## Business Value
 
This ERP helps companies move from scattered spreadsheets, manual administration, and disconnected tools to a centralized digital operating system.
 
The main goal is to make business operations more transparent, structured, and easier to manage from both a business and a financial perspective.
 
## Key benefits:
 
- Centralized business data in one place
- Contract management with related business partners for them
- Manage your employees, their trainings and driving licenses
- Record your business's assets and their categories with procurements and sales
- Record your incomes and expenses and create a P&L view from those
- Add taxes to your expenses, like employee related costs
- Manage your inventory for your business's location if needed
- Have up to date statistics on your inventory
 
Instead of adapting the business to a fixed ERP tool, this system allows the ERP to be adapted to the business.
 
## Main Features
 
- User and role management
- Customer and partner management
- Project and order tracking
- Task and workflow management
- Document management
- Status-based business processes
- Custom dashboards and reports
- Permission-based data access
- REST and GraphQL API access
- Modular data structure
 
## Use Cases
 
The system can support different operational areas, such as:
 
- CRM and customer database management
- Internal project management
- Order and service tracking
- Partner administration
- Document and contract management
- Back-office workflows
- Reporting and operational dashboards
- Custom business process automation
- Basic financial reporting and management
- Inventory tracking 
