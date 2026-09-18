import { SetMetadata } from '@nestjs/common';

export const SITE_RESOURCE_ACCESS_KEY = 'siteResourceAccess';

export type SiteResourceType =
  | 'card'
  | 'cardType'
  | 'chart'
  | 'ciltFrequency'
  | 'ciltMaster'
  | 'ciltPositionLevel'
  | 'ciltSchedule'
  | 'ciltSequence'
  | 'ciltType'
  | 'level'
  | 'oplDetail'
  | 'oplLevel'
  | 'oplMaster'
  | 'oplType'
  | 'position'
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
  required?: boolean;
}

export type SiteResourceAccessMetadata =
  | SiteResourceAccessOptions
  | readonly SiteResourceAccessOptions[];

export const SiteResourceAccess = (
  ...options: [SiteResourceAccessOptions, ...SiteResourceAccessOptions[]]
) =>
  SetMetadata(
    SITE_RESOURCE_ACCESS_KEY,
    options.length === 1 ? options[0] : options,
  );
