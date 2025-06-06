import axios, { AxiosError } from "axios";
import { useLoginStore } from "../Store/useLoginStore";
import { refreshToken } from "./authAPI";

export interface Expense {
  id: number; 
  amount: number;
  category: string;
  date: string;
  userId: number; 
}

export interface ExpenseResponse {
  items: Expense[];
  total: number;
  limit: number;
  page: number;
}

export interface ExpenseCreate {
  amount: number;
  category: string;
  Date: string;
}

export interface ExpenseUpdate {
  amount: number | null;
  category: string | null;
  Date: string | null;
}

const getAuthHeaders = () => {
  const { accessToken, tokenType } = useLoginStore.getState();
  return {
    Authorization: `${tokenType} ${accessToken}`,
  };
};

export const fetchExpenses = async (
  page: number = 1,
  limit: number = 10
): Promise<ExpenseResponse> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } =
    useLoginStore.getState();
  try {
    const response = await axios.get("http://localhost:8000/expenses", {
      params: { page, limit },
      headers: getAuthHeaders(),
    });
   
    const mappedData = {
      ...response.data,
      items: response.data.items.map((item: { expense_id: number; amount: number; category: string; date: string; user_id: number }) => ({
        id: item.expense_id,
        amount: item.amount,
        category: item.category,
        date: item.date,
        userId: item.user_id,
      })),
    };
    return mappedData as ExpenseResponse;
  } catch (error: unknown) {
    if (
      error instanceof AxiosError &&
      error.response?.status === 401 &&
      storedRefreshToken
    ) {
      try {
        const refreshResponse = await refreshToken(storedRefreshToken);
        setTokens(
          refreshResponse.access_token,
          refreshResponse.token_type,
          refreshResponse.refresh_token,
          useLoginStore.getState().name || "User"
        );
        const retryResponse = await axios.get("http://localhost:8000/expenses", {
          params: { page, limit },
          headers: getAuthHeaders(),
        });
        const mappedData = {
          ...retryResponse.data,
          items: retryResponse.data.items.map((item: { expense_id: number; amount: number; category: string; date: string; user_id: number }) => ({
            id: item.expense_id,
            amount: item.amount,
            category: item.category,
            date: item.date,
            userId: item.user_id,
          })),
        };
        return mappedData as ExpenseResponse;
      } catch (refreshError: unknown) {
        console.error("Token refresh failed:", refreshError);
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
    throw error;
  }
};

export const addExpense = async (expense: Omit<ExpenseCreate, "id">): Promise<Expense> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } =
    useLoginStore.getState();
  try {
    const response = await axios.post(
      "http://localhost:8000/expenses",
      expense,
      {
        headers: getAuthHeaders(),
      }
    );
    
    const mappedExpense: Expense = {
      id: response.data.expense_id, 
      amount: response.data.amount,
      category: response.data.category,
      date: response.data.date,
      userId: response.data.user_id, 
    };
    return mappedExpense;
  } catch (error: unknown) {
    if (
      error instanceof AxiosError &&
      error.response?.status === 401 &&
      storedRefreshToken
    ) {
      try {
        const refreshResponse = await refreshToken(storedRefreshToken);
        setTokens(
          refreshResponse.access_token,
          refreshResponse.token_type,
          refreshResponse.refresh_token,
          useLoginStore.getState().name || "User"
        );
        const retryResponse = await axios.post(
          "http://localhost:8000/expenses",
          expense,
          {
            headers: getAuthHeaders(),
          }
        );
        const mappedExpense: Expense = {
          id: retryResponse.data.expense_id, 
          amount: retryResponse.data.amount,
          category: retryResponse.data.category,
          date: retryResponse.data.date,
          userId: retryResponse.data.user_id, 
        };
        return mappedExpense;
      } catch (refreshError: unknown) {
        console.error("Token refresh failed:", refreshError);
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
    throw error;
  }
};

export const updateExpense = async (
  id: number,
  expense: Omit<ExpenseUpdate, "id">
): Promise<void> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } =
    useLoginStore.getState();
  try {
    await axios.put(`http://localhost:8000/expense/${id}`, expense, {
      headers: getAuthHeaders(),
    });
  } catch (error: unknown) {
    if (
      error instanceof AxiosError &&
      error.response?.status === 401 &&
      storedRefreshToken
    ) {
      try {
        const refreshResponse = await refreshToken(storedRefreshToken);
        setTokens(
          refreshResponse.access_token,
          refreshResponse.token_type,
          refreshResponse.refresh_token,
          useLoginStore.getState().name || "User"
        );
        await axios.put(`http://localhost:8000/expense/${id}`, expense, {
          headers: getAuthHeaders(),
        });
      } catch (refreshError: unknown) {
        console.error("Token refresh failed:", refreshError);
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
    throw error;
  }
};

export const deleteExpense = async (id: number): Promise<void> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } =
    useLoginStore.getState();
  try {
    await axios.delete(`http://localhost:8000/expense/${id}`, {
      headers: getAuthHeaders(),
    });
  } catch (error: unknown) {
    if (
      error instanceof AxiosError &&
      error.response?.status === 401 &&
      storedRefreshToken
    ) {
      try {
        const refreshResponse = await refreshToken(storedRefreshToken);
        setTokens(
          refreshResponse.access_token,
          refreshResponse.token_type,
          refreshResponse.refresh_token,
          useLoginStore.getState().name || "User"
        );
        await axios.delete(`http://localhost:8000/expense/${id}`, {
          headers: getAuthHeaders(),
        });
      } catch (refreshError: unknown) {
        console.error("Token refresh failed:", refreshError);
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
    throw error;
  }
};

export const fetchTotalSpent = async (): Promise<number> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } = useLoginStore.getState();
  try {
    const response = await axios.get("http://localhost:8000/expenses/total", {
      headers: getAuthHeaders(),
    });
    return response.data.total || 0;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 401 && storedRefreshToken) {
      try {
        const refreshResponse = await refreshToken(storedRefreshToken);
        setTokens(
          refreshResponse.access_token,
          refreshResponse.token_type,
          refreshResponse.refresh_token,
          useLoginStore.getState().name || "User"
        );
        const retryResponse = await axios.get("http://localhost:8000/expenses/total", {
          headers: getAuthHeaders(),
        });
        return retryResponse.data.total || 0;
      } catch (refreshError: unknown) {
        console.error("Token refresh failed:", refreshError);
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
    console.error("Error fetching total spent:", error);
    return 0;
  }
};

export const fetchMonthlySpent = async (): Promise<number> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } = useLoginStore.getState();
  try {
    const response = await axios.get("http://localhost:8000/expenses/monthly", {
      headers: getAuthHeaders(),
    });
    return response.data.monthly || 0;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 401 && storedRefreshToken) {
      try {
        const refreshResponse = await refreshToken(storedRefreshToken);
        setTokens(
          refreshResponse.access_token,
          refreshResponse.token_type,
          refreshResponse.refresh_token,
          useLoginStore.getState().name || "User"
        );
        const retryResponse = await axios.get("http://localhost:8000/expenses/monthly", {
          headers: getAuthHeaders(),
        });
        return retryResponse.data.monthly || 0;
      } catch (refreshError: unknown) {
        console.error("Token refresh failed:", refreshError);
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
    console.error("Error fetching monthly spent:", error);
    return 0;
  }
};


   function isAxiosError(error: unknown): error is AxiosError {
     return (error as AxiosError)?.isAxiosError === true;
   }