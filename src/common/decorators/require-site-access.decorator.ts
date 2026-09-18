import { SetMetadata } from '@nestjs/common';
import { REQUIRE_SITE_ACCESS_KEY } from 'src/modules/auth/guard/site-access.guard';

export const RequireSiteAccess = () =>
  SetMetadata(REQUIRE_SITE_ACCESS_KEY, true);
