import { SetMetadata } from '@nestjs/common';

/** Handler explicitly constrains all returned data to request.user.fastSiteId. */
export const FAST_SITE_SCOPED_KEY = 'fastSiteScoped';
export const FastSiteScoped = () => SetMetadata(FAST_SITE_SCOPED_KEY, true);
