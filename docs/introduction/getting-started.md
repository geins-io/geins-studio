# Getting Started

## Pre-requisites

- [Node.js](https://nodejs.org) (v20.0.0 or higher)
- A Geins account - [Get a free trial here](https://www.geins.io)

## Installation

```bash
npx create-geins-mc
```

## Environment variables

Create an `.env` file in the root of your project and add the following environment variables:

| Variable      | Description                                                                               | Example                                       |
| ------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| `AUTH_SECRET` | A secret key used to hash tokens, sign and encrypt cookie and generate cryptographic keys | `a01a01a01a01a01a01`                          |
| `AUTH_ORIGIN` | The URL to your application                                                               | `http://localhost:3000`                       |
| `ACCOUNT_KEY` | Your Geins account key                                                                    | `xxxxxxxxxxxxx`                               |
| `API_URL`     | The URL to the Geins API                                                                  | `https://apim-mgmt-api-dev2.azure-api.net/v2` |

## Theming

Geins Merchant Center is built with **[shadcn-vue](https://www.shadcn-vue.com/)** and is using it's theming functionality, which is based on **[Tailwind CSS](https://tailwindcss.com)**. You can easily customize the look and feel of your application by changing the theme located in `assets/css/tailwind.css`. Head on over to shadcn-vue's [themes page](https://www.shadcn-vue.com/themes.html) to try out and customize your theme, which you then can copy into your `tailwind.css` file.

### Design system

To make it easier for you to customize the look and feel of your application, shadcn-vue has created a Figma file that you can use as you wish. You can find the file [here](https://www.figma.com/community/file/1203061493325953101).
