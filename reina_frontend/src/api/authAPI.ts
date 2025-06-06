import axios from 'axios';
import { useLoginStore } from '../Store/useLoginStore';


export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};


export type UserResponse = {
  user_name: string;
  
};


export type LoginFormData = {
  username: string;
  password: string;
};

const getAuthHeaders = () => {
  const { accessToken, tokenType } = useLoginStore.getState();
  return {
    Authorization: `${tokenType} ${accessToken}`,
  };
};

export const loginUser = async (data: LoginFormData): Promise<LoginResponse> => {
  const params = new URLSearchParams();
  params.append('username', data.username);
  params.append('password', data.password);

  const response = await axios.post('http://localhost:8000/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const refreshToken = async (refreshToken: string): Promise<LoginResponse> => {
  const params = new URLSearchParams();
  params.append('refresh_token', refreshToken);

  const response = await axios.post('http://localhost:8000/refresh', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await axios.get('http://localhost:8000/me', {
    headers: getAuthHeaders(),
  });
  return response.data;
};