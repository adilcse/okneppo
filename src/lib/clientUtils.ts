import { useEffect } from "react";
import { useState } from "react";
import axiosClient from "./axios";
import Cookies from "js-cookie";

export async function removeImageFromUrl(imageUrl: string): Promise<boolean> {

    try {
      if (imageUrl.includes('storage.googleapis.com')) {
        await axiosClient.post('/api/delete-image', { imageUrl }, {
          headers: {
            'Authorization': `Bearer ${Cookies.get('admin-token')}`
          }
        });
        return true;
      }
    } catch (error) {
      console.error('Error while deleting image from storage:', error);
      return false;
    }
    return false;
}

export const useDebouncedState = <T>(initialValue: T, delay: number) => {
  const [state, setState] = useState(initialValue);
  const [debouncedState, setDebouncedState] = useState(initialValue);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedState(state);
    }, delay);
    return () => clearTimeout(handler);
  }, [state, delay]);
  return [state, setState, debouncedState] as const;
};
