import api from "../api/axios";

export async function getDashboard(config = {}) {
    const response = await api.get(
        "/dashboard",
        config
    );

    return response.data;
}