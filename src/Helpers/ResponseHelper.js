export const formatApiResponse = (payload, statusCode = 200) => {
  if (typeof payload === "string") {
    return {
      status: statusCode,
      body: {
        success: statusCode >= 200 && statusCode < 300,
        message: payload,
      },
    };
  }

  if (typeof payload === "object" && payload !== null) {
    if ("success" in payload) {
      return {
        status: statusCode,
        body: payload,
      };
    }

    return {
      status: statusCode,
      body: {
        success: statusCode >= 200 && statusCode < 300,
        data: payload,
      },
    };
  }

  return {
    status: statusCode,
    body: {
      success: statusCode >= 200 && statusCode < 300,
      value: payload,
    },
  };
};
