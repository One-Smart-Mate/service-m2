import { SetMetadata } from '@nestjs/common';

export const SITE_RESOURCE_ACCESS_KEY = 'siteResourceAccess';

export type SiteResourceType =
  | 'card'
  | 'cardType'
  | 'chart'
  | 'level'
  | 'preclassifier'
  | 'priority'
  | 'site'
  | 'user';
export type SiteResourceLookup = 'id' | 'uuid';
export type SiteResourceRequestSource = 'params' | 'query' | 'body';

export interface SiteResourceAccessOptions {
  resource: SiteResourceType;
  lookup: SiteResourceLookup;
  source: SiteResourceRequestSource;
  requestKey: string;
}

export const SiteResourceAccess = (options: SiteResourceAccessOptions) =>
  SetMetadata(SITE_RESOURCE_ACCESS_KEY, options);
