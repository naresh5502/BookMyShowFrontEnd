// src/features/auth/authApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { dynamicBaseQuery } from "../../utils/dynamicBaseQuery";

// base url of your backend

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://192.168.1.42:3000/api/",
    // attach token from state to each request (prepareHeaders receives getState)
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // mutation for login
    login: builder.mutation({
      query: (body) => ({
        url: "/Auth/login",
        method: "POST",
        body,
      }),
    }),
    // simple endpoint to fetch current user (optional)
    fetchProfile: builder.query({
      query: () => ({ url: "/Auth/me" }),
      // you can provide tags if you plan to invalidate
    }),
  }),
});

export const { useLoginMutation, useFetchProfileQuery } = authApi;
