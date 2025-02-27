export class GameControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  shift: boolean;
  nitro: boolean;
  fire: boolean;

  constructor() {
    this.forward = false;
    this.backward = false;
    this.left = false;
    this.right = false;
    this.brake = false;
    this.shift = false;
    this.nitro = false;
    this.fire = false;

    // Bind the event handlers to preserve 'this' context
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Remove bind() since we're binding in constructor
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.forward = true;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.backward = true;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.left = true;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.right = true;
        break;
      case ' ':
        this.brake = true;
        break;
      case 'Shift':
        this.shift = true;
        break;
      case 'e':
      case 'E':
        this.nitro = true;
        break;
      case 'f':
      case 'F':
        this.fire = true;
        break;
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.forward = false;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.backward = false;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.right = false;
        break;
      case ' ':
        this.brake = false;
        break;
      case 'Shift':
        this.shift = false;
        break;
      case 'e':
      case 'E':
        this.nitro = false;
        break;
      case 'f':
      case 'F':
        this.fire = false;
        break;
    }
  }

  cleanup() {
    // Remove bind() since we're binding in constructor
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}