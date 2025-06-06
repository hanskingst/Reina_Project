import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.number().min(0, "Amount must be positive"),
  category: z.enum([
    "Food",
    "Savings",
    "Health",
    "Education",
    "Transport",
    "Clothing",
  ], {
    errorMap: () => ({ message: "Category must be one of: Food, Savings, Health, Education, Transport, Clothing" }),
  }),
  date: z.string().refine((val) => new Date(val) <= new Date(), {
    message: "Date cannot be in the future",
  }),
});