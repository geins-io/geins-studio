# Geins Studio

## Introduction

Geins Studio is a comprehensive administrative interface designed for [Geins](https://www.geins.io) commerce backend. This standalone application is built to seamlessly integrate Geins full suite into a unified, user-friendly interface. It serves as a robust foundation, and is built to be easily extendable as new features and integrations are developed.

> [!IMPORTANT]
> Geins Studio is in an early stage. More features and integrations are continuously being added. To see what's available, check out the [features](https://docs.geins.studio/introduction/features) page of the developer documentation.

## Resources

- Use Geins Studio managed at: [https://geins.studio](https://geins.studio)
- Read the developer documentation at: [https://docs.geins.studio](https://docs.geins.studio)

## Make it yours

Geins Studio is designed to be customizable. You can modify the UI, add new features, and integrate with other services to make it fit your needs.

### Pre-requisites

Before setting up Geins Studio, ensure you have the following:

- [Node.js](https://nodejs.org) (v20.0.0 or higher)
- A Geins account - [Get a free trial here](https://www.geins.io)

### Getting Started

To set up Geins Studio, follow these steps:

1. **Install Dependencies**

   ```bash
   # npm
   npm install

   # yarn
   yarn install
   ```

2. **Set Up Environment Variables**

Create an `.env` file in the project root and configure the following variables. Read more about AUTH_SECRET [here](https://auth.sidebase.io/guide/authjs/nuxt-auth-handler#secret).

```ini
GEINS_API_URL=https://mgmtapi.geins.services/v2
GEINS_DEBUG=true
AUTH_SECRET=your_secret_key # https://auth-secret-generator.vercel.app/

```

3. **Start the Development Server**

   ```bash
   # npm
   npm run dev

   # yarn
   yarn dev
   ```

   The application should now be running at `http://localhost:3000`.

### General Setup

Geins Studio is built using modern technologies to ensure flexibility and scalability. The core tech stack includes:

- **Framework:** [Nuxt.js](https://nuxt.com)
- **Language:** [TypeScript](https://www.typescriptlang.org)
- **UI Library:** [shadcn-vue](https://www.shadcn-vue.com)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **State Management:** [Pinia](https://pinia.vuejs.org)

### Theming

Geins Studio is fully customizable with Tailwind CSS and shadcn-vue. You can modify the styles in `assets/css/tailwind.css`. Explore more customization options at:

- [shadcn-vue Themes](https://www.shadcn-vue.com/themes.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

For detailed deployment instructions, check the [Deployment Guide](docs/introduction/deploy.md).

## Contributing

We welcome contributions! Feel free to open issues or submit pull requests to improve Geins Studio.

## License

This project is open-source and available under the MIT License.
