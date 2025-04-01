// Mock Canvas and other browser APIs for unit tests
global.HTMLCanvasElement.prototype.getContext = () => {
  return {
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => {
      return {
        data: new Array(4)
      };
    }),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => {
      return [];
    }),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    ellipse: jest.fn(),
    rect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    clip: jest.fn(),
    isPointInPath: jest.fn(),
    isPointInStroke: jest.fn(),
    measureText: jest.fn(() => {
      return { width: 0 };
    }),
    createLinearGradient: jest.fn(() => {
      return {
        addColorStop: jest.fn()
      };
    }),
    createRadialGradient: jest.fn(() => {
      return {
        addColorStop: jest.fn()
      };
    }),
    createPattern: jest.fn(),
    createImageData: jest.fn(),
    getLineDash: jest.fn(),
    setLineDash: jest.fn(),
    drawFocusIfNeeded: jest.fn(),
    scrollPathIntoView: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    miterLimit: 0,
    lineDashOffset: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 0,
    globalCompositeOperation: '',
    imageSmoothingEnabled: false,
    canvas: {},
  };
};

// Mock Audio Context
global.AudioContext = jest.fn().mockImplementation(() => {
  return {
    createGain: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn(),
        gain: {
          value: 0,
        },
      };
    }),
    createOscillator: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: {
          value: 0,
        },
        type: '',
      };
    }),
    resume: jest.fn(),
    destination: {},
  };
});

// Mock other browser APIs
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock touch events
global.Touch = class Touch {
  constructor(init) {
    this.identifier = init.identifier || 0;
    this.target = init.target || null;
    this.clientX = init.clientX || 0;
    this.clientY = init.clientY || 0;
    this.pageX = init.pageX || 0;
    this.pageY = init.pageY || 0;
    this.screenX = init.screenX || 0;
    this.screenY = init.screenY || 0;
  }
};

global.TouchEvent = class TouchEvent extends Event {
  constructor(type, init = {}) {
    super(type, { bubbles: true, cancelable: true, ...init });
    this.touches = init.touches || [];
    this.targetTouches = init.targetTouches || [];
    this.changedTouches = init.changedTouches || [];
  }
};

// Mock Element.getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => {
  return {
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
  };
});
