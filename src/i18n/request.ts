import { getRequestConfig } from "next-intl/server";

/**
 * i18n scaffolding — English is complete today.
 * To add Twi ("tw") or French ("fr"): create messages/<locale>.json and
 * resolve the locale here from a cookie or the user's settings.
 */
export default getRequestConfig(async () => {
  const locale = "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
