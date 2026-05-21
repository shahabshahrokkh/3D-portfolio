import { createObjectWithPlaceholder } from '../utils/helpers_v2.js';

export async function initSonicCartridge(scene) {
    return await createObjectWithPlaceholder('sonicCartridge', scene);
}
