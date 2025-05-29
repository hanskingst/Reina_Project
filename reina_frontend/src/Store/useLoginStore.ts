import { create } from "zustand";

interface loginStore{
    accessToken: string | null;
    requestToken: string | null;
    tokenType: string | null
    setTokens: (accessToken: string, requestToken: string, tokenType: string) => void,
    clearTokens:() => void
}

export const useLoginStore = create<loginStore>(set => ({
    accessToken:null,
    requestToken:null,
    tokenType:null,
    setTokens:(accessToken,requestToken,tokenType) => set({accessToken,requestToken,tokenType}),
    clearTokens:() =>set({accessToken:null,requestToken:null,tokenType:null})
}))