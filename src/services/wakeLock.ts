class WakeLockService {
  private wakeLockSentinel: WakeLockSentinel | null = null;
  private isRequested = false;

  /**
   * Request screen wake lock to keep the display active during the journey
   */
  public async requestWakeLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      console.warn('Screen Wake Lock API not supported in this browser.');
      return false;
    }

    try {
      this.isRequested = true;
      this.wakeLockSentinel = await navigator.wakeLock.request('screen');

      this.wakeLockSentinel.addEventListener('release', () => {
        // If release happened while still requested (e.g. system interrupt or tab switch), handle clean state
        this.wakeLockSentinel = null;
      });

      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      return false;
    }
  }

  /**
   * Release the wake lock when journey completes or stops
   */
  public async releaseWakeLock(): Promise<void> {
    this.isRequested = false;
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
      } catch (err) {
        console.warn('Error releasing wake lock:', err);
      }
      this.wakeLockSentinel = null;
    }
  }

  public isLocked(): boolean {
    return this.wakeLockSentinel !== null && !this.wakeLockSentinel.released;
  }

  /**
   * Re-acquire lock if tab was blurred and restored while journey active
   */
  public async handleVisibilityResume(): Promise<void> {
    if (this.isRequested && (!this.wakeLockSentinel || this.wakeLockSentinel.released)) {
      await this.requestWakeLock();
    }
  }
}

export const wakeLockService = new WakeLockService();
