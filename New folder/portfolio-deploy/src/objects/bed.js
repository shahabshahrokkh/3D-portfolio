import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initBed(scene) {
  return await createObjectWithPlaceholder('bed', scene);
}
