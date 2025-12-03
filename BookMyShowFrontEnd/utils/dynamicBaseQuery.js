import * as Network from "expo-network";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const dynamicBaseQuery = async (args, api, extraOptions) => {
  // 1. Get the device IP
  let deviceIp = await Network.getIpAddressAsync();

  // if (!deviceIp) {
  //   console.warn("Failed to get device IP. Using fallback localhost.");
  //   deviceIp = "10.0.2.2"; // android emulator fallback
  // }`

  const baseUrl = `http://192.168.1.42:3000/api/`;

  console.log("Base URL being used:", baseUrl);

  // 2. Create the fetchBaseQuery
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  });

  // 3. Forward the request
  return rawBaseQuery(args, api, extraOptions);
};
