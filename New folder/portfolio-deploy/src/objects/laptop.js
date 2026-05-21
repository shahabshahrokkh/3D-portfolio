import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';
import { addMobileHitbox } from '../utils/mobileHitbox.js';

export async function initLaptop(scene) {
  const laptop = await createObjectWithPlaceholder('laptop', scene);

  // Add mobile hitbox for easier tapping on touch devices
  if (laptop) {
    addMobileHitbox(laptop, {
      sizeMultiplier: 1.8, // 80% larger for easier tapping
      height: 0.15,
      yOffset: 0.08,
      action: 'openProjects'
    });
  }

  return laptop;
}
