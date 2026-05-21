export const CONFIG = {
  models: {
    desk: {
      url: '/assets/models/computer_desk.glb',
      position: [0, 0, -6.2], // Under the whiteboard
      rotation: [0, 0, 0], // Face center
      targetSize: { height: 0.75 },
      type: 'environment'
    },
    chair: {
      url: '/assets/models/free_desk_or_gamer_chair.glb',
      position: [0.5, 0, -5.2], // Behind desk
      rotation: [0, Math.PI, 0], // Face desk
      targetSize: { height: 0.34 },
      type: 'environment',
      draggable: true
    },
    laptop: {
      url: '/assets/models/laptop.glb',
      position: [-0.6, 0.76, -6.2], // On desk (left side)
      rotation: [0, 0, 0], // Face center
      targetSize: { width: 0.45 },
      type: 'interactable',
      action: 'openProjects'
    },
    iphone: {
      url: '/assets/models/custom_iphone_17_3d_model.glb',
      position: [-0.2, 0.76, -5.9], // On desk, between laptop and keyboard, near edge
      rotation: [-Math.PI / 2, 0, 0.2], // Screen facing up, slightly angled
      targetSize: { height: 0.16 }, // A phone is ~15-16cm tall
      type: 'interactable',
      action: 'openContact'
    },
    monitor: {
      url: '/assets/models/curved_gamming_monitor.glb',
      position: [0.6, 0.75, -6.3], // On desk (right side, slightly back)
      rotation: [0, 10.5, 0],
      targetSize: { width: 1.3 },
      type: 'environment'
    },
    mouseKeyboard: {
      url: '/assets/models/gaming_mouse_keyboard__rgb_pad_-_3d_model.glb',
      position: [0.2, 0.765, -6.1], // On desk (center, slightly forward)
      rotation: [0, 1.38, 0],
      targetSize: { width: 0.8 },
      type: 'environment'
    },
    bed: {
      url: '/assets/models/messy_bed_2.0_with_wall_mounted_backboard.glb',
      position: [-6.0, 0, 0], // Left wall under shelves
      rotation: [0, Math.PI / 2, 0], // Headboard against left wall
      targetSize: { width: 2.75 },
      type: 'environment' // Changed from interactable to environment - no click action
    },
    cat: {
      url: '/assets/models/sleeping_cat_on_the_table_-_3d_scan.glb',
      position: [-6.99, 0.43, 1.15], // On bed (scaled proportionally with bed size 2.75)
      rotation: [0, Math.PI / 2, 0],
      targetSize: { width: 0.40 },
      type: 'interactable',
      action: 'playCatAnimation'
    },
    whiteboard: {
      url: '/assets/models/whiteboard.glb',
      position: [0, 2, -7.2], // Centered on the back wall
      rotation: [0, Math.PI, 0], // Face into room
      targetSize: { width: 2.0 },
      type: 'interactable',
      action: 'openWhiteboard',
      castShadow: false
    },
    arcade: {
      url: '/assets/models/arcade_machine.glb',
      position: [-6, 0, -6], // Back-left corner of the room
      rotation: [0, Math.PI / 4, 0], // Angled 45° to face center
      targetSize: { height: 1.8 }, // Real arcade cabinet height ~1.8m
      type: 'interactable',
      action: 'playArcade'
    },
    shelves: {
      url: '/assets/models/modern_wall_shelves.glb',
      position: [-7.15, 1.5, -3.5], // Closer to arcade, slightly pulled away from wall
      rotation: [0, Math.PI / 2, 0], // Flat against the left wall
      targetSize: { width: 1.5 },
      type: 'interactable',
      action: 'focusShelves'
    },
    bookshelf: {
      url: '/assets/models/room_shelves.glb',
      position: [-3, 0, -7.2], // Between desk and arcade, against back wall
      rotation: [0, Math.PI, 0], // Face into room
      targetSize: { height: 2.0 },
      type: 'interactable',
      action: 'focusBookshelf'
    },
    pythonIcon: {
      url: '/assets/models/python_programming_language.glb',
      position: [-3.6, 0.50, -7.15], // Inside bookshelf, bottom shelf (row 1), left
      rotation: [0, 0, 0], // Face into room
      targetSize: { height: 0.15 },
      type: 'environment'
    },
    reactIcon: {
      url: '/assets/models/react_logo.glb',
      position: [-2.4, 0.90, -7.15], // Inside bookshelf, second shelf (row 2), right
      rotation: [0, 0, 0], // Face into room
      targetSize: { height: 0.15 },
      type: 'environment'
    },
    htmlIcon: {
      url: '/assets/models/html_css_javascript_model.glb',
      position: [-3.6, 1.70, -7.15], // Inside bookshelf, fourth shelf (row 4), left
      rotation: [0, 0, 0], // Face into room
      targetSize: { height: 0.15 },
      type: 'environment'
    },
    blenderIcon: {
      url: '/assets/models/free_blender_logo_3d_model.glb',
      position: [-2.4, 0.50, -7.15], // Inside bookshelf, bottom shelf (row 1), right
      rotation: [0, 0, 0], // Face into room
      targetSize: { height: 0.15 },
      type: 'environment'
    },
    typewriter: {
      url: '/assets/models/victorian_typewriter.glb',
      position: [-2.4, 1.27, -7.15], // Inside bookshelf, middle shelf (row 3), right
      rotation: [0, 0, 0], // Face into room
      targetSize: { width: 0.28 }, // Small size for typewriter
      type: 'environment'
    },
    csharpIcon: {
      url: '/assets/models/c sharp (1).glb',
      position: [-3.6, 0.90, -7.15], // Inside bookshelf, second shelf (row 2), left
      rotation: [0, 0, 0], // Face into room
      targetSize: { height: 0.15 },
      type: 'environment'
    },
    cIcon: {
      url: '/assets/models/c.glb',
      position: [-2.4, 1.70, -7.15], // Inside bookshelf, fourth shelf (row 4), right
      rotation: [0, 0, 0], // Face into room
      targetSize: { height: 0.15 },
      type: 'environment'
    },
    spaceHelmet: {
      url: '/assets/models/sci_fi_space_helmet.glb',
      position: [-3.0, 0.5, -7.15], // Inside bookshelf, top shelf (row 5), center
      rotation: [0, 0, 0], // Face into room
      targetSize: { height: 0.2 },
      type: 'environment'
    },
    sonicCartridge: {
      url: '/assets/models/sonic_2_mega_drive_cartridge.glb',
      position: [-3.6, 1.30, -7.15], // Inside bookshelf, middle shelf (row 3), left
      rotation: [0, 0, 0], // Face into room
      targetSize: { height: 0.12 },
      type: 'environment'
    },
    logoModel: {
      url: '/assets/models/logo.glb',
      position: [-3.0, 1.30, -7.15], // Inside bookshelf, middle shelf (row 3), center
      rotation: [0, 0, 0],             // Face into room
      targetSize: { height: 0.18 },
      type: 'environment'
    },
    threejsIcon: {
      url: '/assets/models/three-js.glb',
      position: [-2.5, 0.1, -7.10], // Inside bookshelf, bottom (below row 1), center
      rotation: [0, 0, 0],             // Face into room
      targetSize: { height: 0.25 },
      type: 'environment'
    },
    carpet: {
      url: '/assets/models/persian_nain_carpet.glb',
      position: [-2.5, 0.01, -2.5], // Moved closer to arcade (center of the shrunk room)
      rotation: [0, +Math.PI / 4, 0], // Diagonally pointing from bed to desk
      targetSize: { width: 4.0 },
      type: 'environment'
    },
    astronaut: {
      url: '/assets/models/drifting_astronaut.glb',
      position: [5.5, 1.5, 2], // Exactly to the right of the back (whiteboard) wall, outside
      rotation: [0, -Math.PI / 3, 0], // Facing into the room
      targetSize: { height: 1.5 },
      type: 'environment',
      draggable: true,
      castShadow: true,
      receiveShadow: true
    },
    resume: {
      url: '/assets/models/trifold_document_brochure_menu.glb',
      position: [-5.8, 0.666, -0.3], // On the bed, visible position
      rotation: [0, +Math.PI / 3, 0], // Lay flat on bed, readable orientation
      targetSize: { width: 0.4 }, // Good size for visibility
      type: 'interactable',
      action: 'openResume',
      draggable: false // Not draggable, only clickable
    }
  },
  colors: {
    hoverEmissive: 0x222222,
    placeholder: 0x888888
  }
};
