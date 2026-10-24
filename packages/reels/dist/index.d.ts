import type { SwiperOptions } from 'swiper/types';

export type ReelsMediaItem = {
  src: string;
  duration: number;
};

export type ReelsStory = {
  id: string;
  title: string;
  text: string;
  avatar: string;
  preview?: string;
  items: ReelsMediaItem[];
};

export type ReelsOptions = {
  previewSelector?: string;
  previewTriggerSelector?: string;
  previewSwiperSelector?: string;
  modalSwiperSelector?: string;
  previewSwiper?: SwiperOptions;
  modalSwiper?: SwiperOptions;
  modalId?: string;
};

export type ReelsModuleInstance = {
  init: () => Promise<void>;
  destroy: () => void;
};

export interface ThemeDataShape {
  reels?: ReelsStory[];
}

declare global {
  interface Window {
    themeData?: ThemeDataShape;
  }
}

export function setupReels(
  stories?: ReelsStory[],
  options?: ReelsOptions,
): Promise<ReelsModuleInstance>;
export function initReels(options?: ReelsOptions): Promise<ReelsModuleInstance>;
export function normalizeReels(raw: ReelsStory): ReelsStory;
export function fromWpData(raw?: ReelsStory[]): ReelsStory[];
