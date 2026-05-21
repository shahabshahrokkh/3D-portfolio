import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initChair(scene) {
  return await createObjectWithPlaceholder('chair', scene);
}
