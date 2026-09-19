import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const predictFile = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/predict", form);
  return data;
};

export const predictFrame = async (base64) => {
  const { data } = await api.post("/predict_frame", { image: base64 });
  return data;
};

export const getStats = async () => (await api.get("/stats")).data;