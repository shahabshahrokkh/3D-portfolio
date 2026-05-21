import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initCarpet(scene) {
  return await createObjectWithPlaceholder('carpet', scene);
}
