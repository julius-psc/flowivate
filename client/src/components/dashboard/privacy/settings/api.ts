export async function fetchApi<T>(url: string, options: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        response.statusText ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred during fetch.");
    }
  }
}