import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initWindows(scene) {
  // Load window
  await createObjectWithPlaceholder('windowLeft', scene);
}
