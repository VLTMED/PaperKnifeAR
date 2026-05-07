import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { logger } from './logger';

export const hapticImpact = async (style = ImpactStyle.Medium) => {
  if (Capacitor.isNativePlatform() && localStorage.getItem('hapticsEnabled') === 'true') {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      logger.warn('haptics_not_supported', { error: e });
    }
  }
};

export const hapticSuccess = async () => {
  if (Capacitor.isNativePlatform() && localStorage.getItem('hapticsEnabled') === 'true') {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      logger.warn('haptics_not_supported', { error: e });
    }
  }
};

export const hapticSelection = async () => {
  if (Capacitor.isNativePlatform() && localStorage.getItem('hapticsEnabled') === 'true') {
    try {
      await Haptics.selectionStart();
    } catch (e) {
      logger.warn('haptics_not_supported', { error: e });
    }
  }
};
