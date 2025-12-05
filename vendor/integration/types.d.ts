declare module 'astrowind:config' {
  import type {
    AnalyticsConfig,
    AppBlogConfig,
    I18NConfig,
    MetaDataConfig,
    SiteConfig,
    StructuredDataConfig,
    UIConfig,
  } from './utils/configBuilder';

  export const SITE: SiteConfig;
  export const I18N: I18NConfig;
  export const METADATA: MetaDataConfig;
  export const APP_BLOG: AppBlogConfig;
  export const UI: UIConfig;
  export const ANALYTICS: AnalyticsConfig;
  export const STRUCTURED_DATA: StructuredDataConfig;
}
