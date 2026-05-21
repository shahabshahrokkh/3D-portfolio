import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initMonitor(scene) {
  return await createObjectWithPlaceholder('monitor', scene);
}
