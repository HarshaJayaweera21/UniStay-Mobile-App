import { getItem } from '@/utils/storage';
import { API_URL } from '@/constants/api';

const getAuthHeader = async () => {
    const token = await getItem('userToken');
    return {
        'Authorization': `Bearer ${token}`,
    };
};

export const createComplaint = async (title, description, imageUri) => {
    const headers = await getAuthHeader();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    if (imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri: imageUri, name: filename, type });
    }

    const response = await fetch(`${API_URL}/api/complaints`, {
        method: 'POST',
        headers: {
            ...headers,
            // 'Content-Type': 'multipart/form-data', // Fetch identifies this automatically with FormData
        },
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error creating complaint');
    return data;
};

export const getMyComplaints = async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/complaints/my`, {
        method: 'GET',
        headers,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error fetching complaints');
    return data;
};

export const getAllComplaints = async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/complaints`, {
        method: 'GET',
        headers,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error fetching all complaints');
    return data;
};

export const getComplaintById = async (id) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/complaints/${id}`, {
        method: 'GET',
        headers,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error fetching complaint details');
    return data;
};

export const updateComplaintStatus = async (id, status) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/complaints/${id}`, {
        method: 'PUT',
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error updating status');
    return data;
};

export const deleteComplaint = async (id) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/complaints/${id}`, {
        method: 'DELETE',
        headers,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error deleting complaint');
    return data;
};
