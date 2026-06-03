import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './auth.constants';

/** Marque une route comme accessible sans authentification (ex: /auth/login). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
