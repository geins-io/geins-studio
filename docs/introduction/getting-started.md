# Getting Started

## Pre-requisites

- [Node.js](https://nodejs.org) (v20.0.0 or higher)
- A Geins account - [Get a free trial here](https://www.geins.io)

## Installation

Fork or clone the repository:

```bash
git clone https://github.com/geins-io/geins-studio.git
cd geins-studio
```

## Environment variables

Create an `.env` file in the root of your project and add your variables. Below is a list of all available environment variables you can use in this project. Read more about AUTH_SECRET [here](https://auth.sidebase.io/guide/authjs/nuxt-auth-handler#secret).

| Variable        | Description                                                                               | Default                 | Required      |
| --------------- | ----------------------------------------------------------------------------------------- | ----------------------- | ------------- |
| `GEINS_API_URL` | The URL to the Geins API                                                                  | -                       | Always        |
| `AUTH_SECRET`   | A secret key used to hash tokens, sign and encrypt cookie and generate cryptographic keys | -                       | Always        |
| `BASE_URL`      | The URL to the application                                                                | `http://localhost:3000` | In production |
| `GEINS_DEBUG`   | Geins debug flag                                                                          | `false`                 | Optional      |
| `AUTH_PATH`     | The path to your auth server function                                                     | `/api/auth`             | Optional      |

## Theming

Geins Studio is built with **[shadcn-vue](https://www.shadcn-vue.com/)** and is using it's theming functionality, which is based on **[Tailwind CSS](https://tailwindcss.com)**. You can easily customize the look and feel of your application by changing the theme located in `/app/assets/css/main.css`.

### Design system

To make it easier for you to customize the look and feel of your application, shadcn-vue has created a Figma file that you can use as you wish. You can find the file [here](https://www.figma.com/community/file/1203061493325953101).
