import { SetMetadata } from '@nestjs/common';
import { SKIP_SITE_ACCESS_KEY } from 'src/modules/auth/guard/site-access.guard';

export const SkipSiteAccess = () => SetMetadata(SKIP_SITE_ACCESS_KEY, true);
