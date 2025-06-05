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