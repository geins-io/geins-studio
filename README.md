# Geins Studio

## Introduction

Geins Studio is a comprehensive administrative interface designed for e-commerce solutions. This standalone application seamlessly integrates Geins PIM, CRM, WMS, CMS, and other essential tools into a unified, user-friendly platform.

## Pre-requisites

Before setting up Geins Studio, ensure you have the following:

- [Node.js](https://nodejs.org) (v20.0.0 or higher)
- A Geins account - [Get a free trial here](https://www.geins.io)

## Getting Started

To set up Geins Studio, follow these steps:

1. **Install Dependencies**

   ```bash
   # npm
   npm install

   # yarn
   yarn install
   ```

2. **Set Up Environment Variables**

   Create an `.env` file in the project root and configure the following variables:

   ```ini
   GEINS_API_URL=https://apim-mgmt-api-dev2.azure-api.net/v2
   GEINS_DEBUG=true
   AUTH_SECRET=your_secret_key
   AUTH_ORIGIN=http://localhost:3000
   ```

3. **Start the Development Server**

   ```bash
   # npm
   npm run dev

   # yarn
   yarn dev
   ```

   The application should now be running at `http://localhost:3000`.

## General Setup

Geins Studio is built using modern technologies to ensure flexibility and scalability. The core tech stack includes:

- **Framework:** [Nuxt.js](https://nuxt.com)
- **Language:** [TypeScript](https://www.typescriptlang.org)
- **UI Library:** [shadcn-vue](https://www.shadcn-vue.com)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **State Management:** [Pinia](https://pinia.vuejs.org)

## Theming

Geins Studio is fully customizable with Tailwind CSS and shadcn-vue. You can modify the styles in `assets/css/tailwind.css`. Explore more customization options at:

- [shadcn-vue Themes](https://www.shadcn-vue.com/themes.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

For detailed deployment instructions, check the [Deployment Guide](docs/introduction/deploy.md).

## Contributing

We welcome contributions! Feel free to open issues or submit pull requests to improve Geins Studio.

## License

This project is open-source and available under the MIT License.
