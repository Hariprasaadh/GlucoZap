
import { create } from 'zustand';

export type ScreeningData = {
  questionnaire: any;
  wearableAnalysis: any;
  skinScan: any;
  bodyScan: any;
  metabolicDisturbance: any;
  eyeScan: any;
  medicalTranscript: any;
};

type ScreeningState = {
  progress: number;
  screeningData: ScreeningData;
  updateProgress: (progress: number) => void;
  updateScreeningData: (data: Partial<ScreeningData>) => void;
  resetScreening: () => void;
};

export const useScreeningStore = create<ScreeningState>((set) => ({
  progress: 0,
  screeningData: {
    questionnaire: null,
    wearableAnalysis: null,
    skinScan: null,
    bodyScan: null,
    metabolicDisturbance: null,
    eyeScan: null,
    medicalTranscript: null,
  },
  updateProgress: (progress) => set({ progress }),
  updateScreeningData: (data) =>
    set((state) => ({
      screeningData: { ...state.screeningData, ...data },
    })),
  resetScreening: () =>
    set({
      progress: 0,
      screeningData: {
        questionnaire: null,
        wearableAnalysis: null,
        skinScan: null,
        bodyScan: null,
        metabolicDisturbance: null,
        eyeScan: null,
        medicalTranscript: null,
      },
    }),
}));
