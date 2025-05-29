import { create } from "zustand";

interface profileStore{
    userId:number | null,
    userName:string | null,
    email:string | null,
    setId:(id:number) => void,
    setName:(username:string) =>void
    setEmail:(email:string) => void
}

export const useProfileStore = create<profileStore>(set => ({
    userId:null,
    userName:null,
    email:null,
    setId:(userId) => set({userId}),
    setName:(userName) => set({userName}),
    setEmail:(email) => set({email}),
}))