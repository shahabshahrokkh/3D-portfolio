import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initBlenderIcon(scene) {
    return await createObjectWithPlaceholder('blenderIcon', scene);
}
