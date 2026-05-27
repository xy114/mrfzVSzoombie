export class GifAnimator {
  constructor(frames, naturalWidth, naturalHeight) {
    this._frames = frames;
    this.naturalWidth = naturalWidth;
    this.naturalHeight = naturalHeight;
    this._currentIndex = 0;
    this._accumulator = 0;
    this._active = true;
    this._loop = true;
  }

  setLoop(shouldLoop) {
    this._loop = shouldLoop;
  }

  get isActive() {
    return this._active;
  }

  get frameCount() {
    return this._frames.length;
  }

  update(deltaTime) {
    if (!this._active || this._frames.length <= 1) return;
    this._accumulator += deltaTime;
    while (this._accumulator >= this._frames[this._currentIndex].delay) {
      this._accumulator -= this._frames[this._currentIndex].delay;
      this._currentIndex++;
      if (this._currentIndex >= this._frames.length) {
        if (this._loop) {
          this._currentIndex = 0;
        } else {
          this._currentIndex = this._frames.length - 1;
          this._active = false;
          break;
        }
      }
    }
  }

  getCurrentCanvas() {
    return this._frames[this._currentIndex].canvas;
  }

  reset() {
    this._currentIndex = 0;
    this._accumulator = 0;
    this._active = true;
  }
}