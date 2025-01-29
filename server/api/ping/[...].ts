import { defineEventHandler, readBody, getHeaders } from 'h3';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const service = event.context.params?._;

  const url = `${config.public.apiUrl}/${service}/ping`;
  console.log(`Pinging ${service} service...`);

  try {
    await fetch(url);
  } catch (error) {
    return {
      success: false,
      error,
    };
  }

  return {
    success: true,
  };
});
