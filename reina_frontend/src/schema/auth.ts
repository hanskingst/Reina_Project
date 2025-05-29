import {z} from 'zod'

export const signupSchema = z.object({
    username:z.string().min(5,'userName must be atleast 5 characters'),
    email:z.string().email('Invalid email'),
    password:z.string().min(8, 'Password must be atleast 8 characters')
})

export const loginSchema = z.object({
    username :z.string().min(5, 'UserName must be atleast 5 characters'),
    password:z.string().min(8,'Password must be atleast 8 characters')
})