import type { API } from "@/hl-common/api/API";
import { Routes } from "@/hl-common/api/routes";

import { publicHavenUrl } from "@/utils/env";

import { ApiError, isHavenError, replaceParams } from "./fetchUtils";

const _request = async (
  req: { method: string; path: string },
  args?: {
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: object;
  },
) => {
  const { params, query, body } = args || {};

  let url = replaceParams(req.path, params);

  if (query) {
    const queryString = new URLSearchParams(
      Object.fromEntries(
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const fullUrl = `${publicHavenUrl}/api${url}`;

  try {
    const response = await fetch(fullUrl, {
      method: req.method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();

    if (isHavenError(result)) {
      throw new ApiError(result.message || "Unknown error", result.statusCode);
    }

    return result;
  } catch (error) {
    console.error(`API request failed: ${req.method} ${url}`, error);
    throw error;
  }
};

export const sendOtp: API.sendOtp.func = async (args) =>
  _request(Routes.sendOtp, args);

export const verifyOtp: API.verifyOtp.func = async (args) =>
  _request(Routes.verifyOtp, args);

export const register: API.register.func = async (args) =>
  _request(Routes.register, args);

export const logout: API.logout.func = async () => _request(Routes.logout);

export const ingestEvent: API.ingestEvent.func = async (args) =>
  _request(Routes.ingestEvent, args);

export const createCourse: API.createCourse.func = async (args) =>
  _request(Routes.createCourse, args);

export const updateCourse: API.updateCourse.func = async (args) =>
  _request(Routes.updateCourse, args);

export const createModule: API.createModule.func = async (args) =>
  _request(Routes.createModule, args);

export const updateModule: API.updateModule.func = async (args) =>
  _request(Routes.updateModule, args);

export const deleteModule: API.deleteModule.func = async (args) =>
  _request(Routes.deleteModule, args);

export const createCard: API.createCard.func = async (args) =>
  _request(Routes.createCard, args);

export const updateCard: API.updateCard.func = async (args) =>
  _request(Routes.updateCard, args);

export const deleteCard: API.deleteCard.func = async (args) =>
  _request(Routes.deleteCard, args);
