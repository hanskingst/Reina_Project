import { create } from 'zustand';

type LoginStore = {
  accessToken: string | null;
  tokenType: string | null;
  refreshToken: string | null; 
  name: string | null;
  netIncome: number;
  setTokens: (accessToken: string, tokenType: string, refreshToken: string, name: string) => void;
  clearTokens: () => void;
  updateNetIncome: (income: number) => void;
};

export const useLoginStore = create<LoginStore>((set) => ({
  accessToken: null,
  tokenType: null,
  refreshToken: null, 
  name: null,
  netIncome: 50000,
  setTokens: (accessToken, tokenType, refreshToken, name) =>
    set({ accessToken, tokenType, refreshToken, name }),
  clearTokens: () => set({ accessToken: null, tokenType: null, refreshToken: null, name: null }),
  updateNetIncome: (income) => set({ netIncome: income }),
}));