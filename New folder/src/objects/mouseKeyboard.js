import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initMouseKeyboard(scene) {
  return await createObjectWithPlaceholder('mouseKeyboard', scene);
}
