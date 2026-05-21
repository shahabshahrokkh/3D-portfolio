import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initDesk(scene) {
  return await createObjectWithPlaceholder('desk', scene);
}
