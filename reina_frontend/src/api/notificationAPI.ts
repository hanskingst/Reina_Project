import axios, { AxiosError } from 'axios';
import { useLoginStore } from '../Store/useLoginStore';
import { refreshToken } from './authAPI';

export type Notification = {
  notification_id: number;
  user_Id: number;
  message: string;
  is_read: boolean;
  created_at: string;
};

const getAuthHeaders = () => {
  const { accessToken, tokenType } = useLoginStore.getState();
  return {
    Authorization: `${tokenType} ${accessToken}`,
  };
};

export const fetchNotifications = async (): Promise<Notification[]> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } = useLoginStore.getState();
  try {
    const response = await axios.get('http://localhost:8000/notifications/details', {
      headers: getAuthHeaders(),
    });
    return Array.isArray(response.data) ? response.data : [];
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
        const retryResponse = await axios.get('http://localhost:8000/notifications/details', {
          headers: getAuthHeaders(),
        });
        return Array.isArray(retryResponse.data) ? retryResponse.data : [];
      } catch (refreshError: unknown) {
        console.error('Token refresh failed:', refreshError);
        clearTokens();
        throw new Error('Session expired. Please login again.');
      }
    }
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const addNotification = async (message: string): Promise<Notification> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } = useLoginStore.getState();
  try {
    const response = await axios.post('http://localhost:8000/notifications', {
      message,
      isRead: false,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data as Notification;
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
        const retryResponse = await axios.post('http://localhost:8000/notifications', {
          message,
          isRead: false,
        }, {
          headers: getAuthHeaders(),
        });
        return retryResponse.data as Notification;
      } catch (refreshError: unknown) {
        console.error('Token refresh failed:', refreshError);
        clearTokens();
        throw new Error('Session expired. Please login again.');
      }
    }
    throw error;
  }
};

export const deleteNotification = async (id: number): Promise<{ status: string; message: string }> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } = useLoginStore.getState();
  try {
    const response = await axios.delete<{ status: string; message: string }>(
      `http://localhost:8000/notification/${id}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401 && storedRefreshToken) {
      try {
        const refreshResponse = await refreshToken(storedRefreshToken);
        setTokens(
          refreshResponse.access_token,
          refreshResponse.token_type,
          refreshResponse.refresh_token,
          useLoginStore.getState().name || "User"
        );
        const retryResponse = await axios.delete<{ status: string; message: string }>(
          `http://localhost:8000/notification/${id}`,
          {
            headers: getAuthHeaders(),
          }
        );
        return retryResponse.data;
      } catch (refreshError: unknown) {
        console.error("Token refresh failed:", refreshError);
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
    throw error;
  }
};

export const markAsReadNotification = async (id: number): Promise<void> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } = useLoginStore.getState();
  try {
    await axios.patch(`http://localhost:8000/notifications/${id}/read`, {}, {
      headers: getAuthHeaders(),
    });
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
        await axios.patch(`http://localhost:8000/notifications/${id}/read`, {}, {
          headers: getAuthHeaders(),
        });
      } catch (refreshError: unknown) {
        console.error('Token refresh failed:', refreshError);
        clearTokens();
        throw new Error('Session expired. Please login again.');
      }
    }
    throw error;
  }
};

export const deleteAllNotifications = async (): Promise<{ status: string; message: string }> => {
  const { refreshToken: storedRefreshToken, setTokens, clearTokens } = useLoginStore.getState();

  try {
    const response = await axios.delete<{ status: string; message: string }>(
      `http://localhost:8000/notifications`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401 && storedRefreshToken) {
      try {
        const refreshResponse = await refreshToken(storedRefreshToken);
        setTokens(
          refreshResponse.access_token,
          refreshResponse.token_type,
          refreshResponse.refresh_token,
          useLoginStore.getState().name || "User"
        );
        const retryResponse = await axios.delete<{ status: string; message: string }>(
          `http://localhost:8000/notifications`,
          { headers: getAuthHeaders() }
        );
        return retryResponse.data;
      } catch (refreshError: unknown) {
        console.error("Token refresh failed:", refreshError);
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
    throw error;
  }
};


function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError)?.isAxiosError === true;
}