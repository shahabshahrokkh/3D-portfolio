// Central registry for loaded models and interactable objects

export const ModelRegistry = {
  models: new Map(), // name -> THREE.Object3D (or placeholder)
  interactables: [], // array of THREE.Object3D to be checked by raycaster
  draggables: [], // array for drag raycaster

  registerModel(name, object) {
    this.models.set(name, object);
    object.name = name;
  },

  getModel(name) {
    return this.models.get(name);
  },

  registerInteractable(object) {
    if (!this.interactables.includes(object)) {
      this.interactables.push(object);
    }
  },

  removeInteractable(object) {
    const index = this.interactables.indexOf(object);
    if (index > -1) {
      this.interactables.splice(index, 1);
    }
  },
  
  getInteractables() {
    return this.interactables;
  },

  registerDraggable(object) {
    if (!this.draggables.includes(object)) {
      this.draggables.push(object);
    }
  },

  getDraggables() {
    return this.draggables;
  }
};
