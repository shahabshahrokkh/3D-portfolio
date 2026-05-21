import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import { addMobileHitbox } from '../utils/mobileHitbox.js';

export async function initCat(scene) {
  const cat = await createObjectWithPlaceholder('cat', scene);

  // Add mobile hitbox for easier tapping on touch devices
  if (cat) {
    addMobileHitbox(cat, {
      sizeMultiplier: 1.7, // 70% larger for easier tapping
      height: 0.12,
      yOffset: 0.06,
      action: 'playCatAnimation'
    });
  }

  return cat;
}
