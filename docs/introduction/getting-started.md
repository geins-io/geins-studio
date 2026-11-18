# Getting Started

This guide covers the steps required to set up and run Geins Studio locally. Follow the instructions below to get started with your own instance of Geins Studio.

:::tip TIP
You can use Geins Studio managed at: [https://geins.studio](https://geins.studio)
:::

## Pre-requisites

- [Node.js](https://nodejs.org) (v20.0.0 or higher)
- A Geins account - [Get a free trial here](https://www.geins.io)

## Installation

Clone the repository to create your own project:

```bash
git clone https://github.com/geins-io/geins-studio.git
cd geins-studio
```

## Environment variables

Create an `.env` file in the root of your project and add your variables. Below is a list of all available environment variables you can use in this project.

| Variable            | Description                                                                                                                                                                                                                    | Default                 | Required                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ---------------------------- |
| `GEINS_API_URL`     | The URL to the Geins API                                                                                                                                                                                                       | -                       | Always                       |
| `NUXT_APP_SECRET`   | Seals the session cookie that holds the Geins tokens; at least 32 characters (`openssl rand -base64 32`). `pnpm dev` generates one if unset, builds don't                                                                      | -                       | In production                |
| `AUTH_SECRET`       | The old next-auth secret, kept only to migrate sessions signed in before the sealed session (cutover)                                                                                                                          | -                       | Until the cutover is removed |
| `BASE_URL`          | The URL to the application                                                                                                                                                                                                     | `http://localhost:3000` | In production                |
| `GEINS_DEBUG`       | Geins debug flag                                                                                                                                                                                                               | `false`                 | Optional                     |
| `INCLUDE_DEV_PAGES` | Include the dev-only pages under `app/pages/dev/**` (e.g. `/dev/asset-picker`) in the build. Always on in `pnpm dev`; set to `true` on the QA and preview deploys, never on production — the harness copy is hardcoded English | unset                   | Optional                     |

## Theming

Geins Studio is built with **[shadcn-vue](https://www.shadcn-vue.com/)** and is using it's theming functionality, which is based on **[Tailwind CSS](https://tailwindcss.com)**. You can easily customize the look and feel of your application by changing the theme located in `/app/assets/css/main.css`.

### Design system

To make it easier for you to customize the look and feel of your application, shadcn-vue has created a Figma file that you can use as you wish. You can find the file [here](https://www.figma.com/community/file/1203061493325953101).
