"use client";

import { useState, useEffect } from "react";

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    timestamp: string;
    rateLimit?: {
      remaining: number;
      limit: number;
    };
  };
}

interface Savedtoken {
  name: string;
  key: string;
  lastUsed: string;
}

export default function ApiPlaygroundPage() {
  const [token, settoken] = useState("");
  const [rememberKey, setRememberKey] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Savedtoken[]>([]);
  const [endpoint, setEndpoint] = useState("/apis/v1/center-lookup?number=");
  const [method, setMethod] = useState("GET");
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [authMethod, setAuthMethod] = useState<"x-api-key" | "authorization">(
    "authorization"
  );

  useEffect(() => {
    loadSavedKeys();
    loadHistory();

    // Load auth method preference from localStorage
    const savedAuthMethod = localStorage.getItem("apiPlaygroundAuthMethod");
    if (savedAuthMethod) {
      setAuthMethod(savedAuthMethod as "x-api-key" | "authorization");
    }
  }, []);

  const loadSavedKeys = () => {
    try {
      const saved = localStorage.getItem("apiPlaygroundSavedKeys");
      if (saved) {
        const keys = JSON.parse(saved);
        setSavedKeys(keys);

        if (keys.length > 0) {
          const mostRecent = keys.sort(
            (a: Savedtoken, b: Savedtoken) =>
              new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
          )[0];
          settoken(mostRecent.key);
          setRememberKey(true);
        }
      }
    } catch (error) {
      console.error("Failed to load saved API keys:", error);
    }
  };

  const savetoken = () => {
    if (!token.trim()) return;

    const keyName =
      prompt(
        'Enter a name for this API key (e.g., "Production", "Testing"):'
      ) || "Unnamed Key";

    const newKey: Savedtoken = {
      name: keyName,
      key: token,
      lastUsed: new Date().toISOString(),
    };

    const updatedKeys = [
      newKey,
      ...savedKeys.filter((k) => k.key !== token),
    ].slice(0, 5);

    localStorage.setItem("apiPlaygroundSavedKeys", JSON.stringify(updatedKeys));
    setSavedKeys(updatedKeys);
    alert("API key saved securely!");
  };

  const removeSavedKey = (keyToRemove: string) => {
    const updatedKeys = savedKeys.filter((k) => k.key !== keyToRemove);
    localStorage.setItem("apiPlaygroundSavedKeys", JSON.stringify(updatedKeys));
    setSavedKeys(updatedKeys);

    if (token === keyToRemove) {
      settoken("");
      setRememberKey(false);
    }
  };

  const loadHistory = () => {
    try {
      const savedHistory = localStorage.getItem("apiPlaygroundHistory");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const saveToHistory = (request: any, response: any) => {
    const newHistory = [
      { timestamp: new Date().toISOString(), request, response },
      ...history.slice(0, 9),
    ];
    setHistory(newHistory);
    localStorage.setItem("apiPlaygroundHistory", JSON.stringify(newHistory));
  };
  const executeRequest = async () => {
    if (!token.trim()) {
      setResponse({
        success: false,
        error: "API key is required",
      });
      return;
    }

    setLoading(true);
    setResponse(null);
    setResponseTime(0);

    const startTime = performance.now();

    try {
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? window.location.origin
          : "https://192.168.0.159:3002";

      const url = `${baseUrl}${endpoint}`;

      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
      };

      if (method !== "GET" && requestBody) {
        headers["Content-Type"] = "application/json";
      }

      const options: RequestInit = { method, headers, credentials: "omit" };

      if (method !== "GET" && requestBody) {
        if (!isValidJson(requestBody)) {
          throw new Error("Invalid JSON in request body");
        }
        options.body = requestBody;
      }

      console.log("Making request with headers:", headers);
      console.log("URL:", url);

      const response = await fetch(url, options);
      // ... rest of your logic

      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        data = {
          success: false,
          error: `Invalid JSON response: ${text.substring(0, 100)}...`,
        };
      }

      const endTime = performance.now();

      const formattedResponse: ApiResponse = {
        success: data?.success || false,
        data: data?.data,
        error:
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message
            ? data.error.message
            : data?.error
            ? JSON.stringify(data.error)
            : data?.message || undefined,
        metadata: data?.metadata,
      };

      setResponse(formattedResponse);
      setResponseTime(endTime - startTime);

      saveToHistory(
        {
          url,
          method,
          headers,
          body: requestBody,
        },
        formattedResponse
      );

      if (savedKeys.some((k) => k.key === token)) {
        const updatedKeys = savedKeys.map((k) =>
          k.key === token ? { ...k, lastUsed: new Date().toISOString() } : k
        );
        localStorage.setItem(
          "apiPlaygroundSavedKeys",
          JSON.stringify(updatedKeys)
        );
        setSavedKeys(updatedKeys);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Request failed";
      setResponse({
        success: false,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const isValidJson = (str: string): boolean => {
    try {
      if (str.trim() === "") return true;
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const formatJson = (obj: any) => {
    try {
      if (typeof obj === "string") {
        return obj;
      }
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const renderError = (error: any) => {
    if (typeof error === "string") {
      return error;
    }

    if (error && typeof error === "object") {
      if (error.message) {
        return error.message;
      }
      if (error.code && error.message) {
        return `${error.code}: ${error.message}`;
      }
      return JSON.stringify(error, null, 2);
    }

    return "Unknown error occurred";
  };

  const presetEndpoints = [
    { value: "/apis/v1/center-lookup?number=", label: "Center Lookup" },
    { value: "/apis/v1/dispute-center/", label: "Get Dispute Center" },
    { value: "/apis/v1/dispute-center", label: "List Dispute Centers" },
    { value: "/apis/v1/helper/", label: "Helper Endpoint" },
  ];

  const presetBodies = {
    "POST /dispute-center": JSON.stringify(
      {
        name: "New Dispute Center",
        address: "123 Main Street",
        state: "Lagos",
        lga: "Ikeja",
        email: "center@example.com",
        phone: "+2348000000000",
      },
      null,
      2
    ),
    "PUT /dispute-center": JSON.stringify(
      {
        name: "Updated Center Name",
        address: "456 Updated Street",
      },
      null,
      2
    ),
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Security Warning Modal */}
      {showSecurityWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 border">
            <h3 className="text-xl font-semibold mb-4 text-destructive">
              ⚠️ Security Warning
            </h3>
            <p className="mb-4 text-foreground">
              Storing API keys in your browser is convenient but has security
              risks:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-1 text-sm text-muted-foreground">
              <li>Anyone with access to your computer can see your API keys</li>
              <li>
                Malicious browser extensions could potentially read stored keys
              </li>
              <li>
                If your computer is compromised, your API keys could be stolen
              </li>
            </ul>
            <p className="mb-4 font-medium text-foreground">
              Only save API keys if you understand and accept these risks.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowSecurityWarning(false)}
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setRememberKey(true);
                  setShowSecurityWarning(false);
                  savetoken();
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                I Understand, Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Playground</h1>
          <p className="text-muted-foreground mt-1">
            Test your API endpoints in real-time
          </p>
        </div>
        <button
          onClick={() => (window.location.href = "/admin/getApi")}
          className="px-4 py-2 bg-primary text-secondary-foreground rounded-md hover:bg-secondary/80"
        >
          Manage Keys
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Request */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg shadow-md p-6 border">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              Request Configuration
            </h2>

            {/* Authentication Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Authentication Method
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="authorization"
                    checked={authMethod === "authorization"}
                    onChange={(e) => {
                      setAuthMethod("authorization");
                      localStorage.setItem(
                        "apiPlaygroundAuthMethod",
                        "authorization"
                      );
                    }}
                    className="rounded border-input"
                  />
                  <span className="text-sm text-foreground">
                    Authorization: Bearer
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="x-api-key"
                    checked={authMethod === "x-api-key"}
                    onChange={(e) => {
                      setAuthMethod("x-api-key");
                      localStorage.setItem(
                        "apiPlaygroundAuthMethod",
                        "x-api-key"
                      );
                    }}
                    className="rounded border-input"
                  />
                  <span className="text-sm text-foreground">X-API-Key</span>
                </label>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                API Key{" "}
                {authMethod === "authorization"
                  ? "(Bearer Token)"
                  : "(X-API-Key)"}
              </label>

              {savedKeys.length > 0 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Saved Keys
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedKey = savedKeys.find(
                        (k) => k.key === e.target.value
                      );
                      if (selectedKey) {
                        settoken(selectedKey.key);
                        setRememberKey(true);
                      }
                    }}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="">Select a saved key...</option>
                    {savedKeys.map((savedKey, index) => (
                      <option key={index} value={savedKey.key}>
                        {savedKey.name} (••••{savedKey.key.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="password"
                value={token}
                onChange={(e) => settoken(e.target.value)}
                placeholder={
                  authMethod === "authorization"
                    ? "Enter your Bearer token"
                    : "Enter your API key (starts with sk_...)"
                }
                className="w-full p-2 border border-input rounded-md font-mono text-sm bg-background text-foreground"
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rememberKey"
                  checked={rememberKey}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setShowSecurityWarning(true);
                    } else {
                      setRememberKey(false);
                      if (savedKeys.some((k) => k.key === token)) {
                        removeSavedKey(token);
                      }
                    }
                  }}
                  className="rounded border-input"
                />
                <label
                  htmlFor="rememberKey"
                  className="text-sm text-muted-foreground"
                >
                  Save this key for future use
                </label>
              </div>

              {rememberKey &&
                token &&
                !savedKeys.some((k) => k.key === token) && (
                  <button
                    onClick={savetoken}
                    className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
                  >
                    💾 Save Key Now
                  </button>
                )}
            </div>

            {/* HTTP Method */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground">
                HTTP Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            {/* Endpoint */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground">
                Endpoint
              </label>
              <div className="flex space-x-2">
                <select
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="flex-1 p-2 border border-input rounded-md bg-background text-foreground"
                >
                  {presetEndpoints.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setEndpoint("")}
                  className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-accent"
                >
                  Clear
                </button>
              </div>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="Enter endpoint (e.g., /apis/v1/center-lookup?number=123)"
                className="w-full mt-2 p-2 border border-input rounded-md font-mono text-sm bg-background text-foreground"
              />
            </div>

            {/* Request Body */}
            {(method === "POST" || method === "PUT" || method === "PATCH") && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Request Body
                  </label>
                  <select
                    onChange={(e) =>
                      setRequestBody(
                        presetBodies[
                          e.target.value as keyof typeof presetBodies
                        ] || ""
                      )
                    }
                    className="px-2 py-1 border border-input rounded-md text-sm bg-background text-foreground"
                  >
                    <option value="">Preset bodies</option>
                    <option value="POST /dispute-center">
                      POST /dispute-center
                    </option>
                    <option value="PUT /dispute-center">
                      PUT /dispute-center
                    </option>
                  </select>
                </div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="Enter JSON request body"
                  rows={8}
                  className="w-full p-2 border border-input rounded-md font-mono text-sm bg-background text-foreground"
                  style={{
                    borderColor:
                      requestBody && !isValidJson(requestBody)
                        ? "hsl(var(--destructive))"
                        : "",
                  }}
                />
                {requestBody && !isValidJson(requestBody) && (
                  <p className="text-destructive text-sm mt-1">
                    Invalid JSON format
                  </p>
                )}
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={executeRequest}
              disabled={
                loading ||
                !token.trim() ||
                (requestBody && !isValidJson(requestBody))
              }
              className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending Request..." : "Execute Request"}
            </button>
          </div>

          {/* Request History */}
          {history.length > 0 && (
            <div className="bg-card rounded-lg shadow-md p-6 border">
              <h3 className="text-lg font-semibold mb-4 text-card-foreground">
                Recent Requests
              </h3>
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 border border-border rounded-md cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setEndpoint(
                        item.request.url.replace(
                          "https://192.168.0.159:3002",
                          ""
                        )
                      );
                      setMethod(item.request.method);
                      setRequestBody(item.request.body || "");
                      setResponse(item.response);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.response.success
                            ? "bg-green-100 text-green-800"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {item.request.method}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-mono mt-1 truncate text-foreground">
                      {item.request.url.replace(
                        "https://192.168.0.159:3002",
                        ""
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Auth:{" "}
                      {item.request.headers["Authorization"]
                        ? "Bearer ••••" +
                          (
                            item.request.headers["Authorization"] as string
                          ).slice(-4)
                        : item.request.headers["X-API-Key"]
                        ? "X-API-Key ••••" +
                          (item.request.headers["X-API-Key"] as string).slice(
                            -4
                          )
                        : "No auth"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Response */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg shadow-md p-6 border">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">
              Response
            </h2>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {response && !loading && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      response.success
                        ? "bg-green-100 text-green-800"
                        : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {response.success ? "Success" : "Error"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {responseTime.toFixed(0)} ms
                  </span>
                </div>

                {response.metadata?.rateLimit && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-800">
                      Rate Limit: {response.metadata.rateLimit.remaining} /{" "}
                      {response.metadata.rateLimit.limit} remaining
                    </div>
                  </div>
                )}

                <div className="bg-muted rounded-md p-4">
                  <pre className="text-sm overflow-auto max-h-96 text-foreground">
                    {formatJson(response)}
                  </pre>
                </div>

                {response.error && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                    <h4 className="font-medium text-destructive">Message:</h4>
                    <p className="text-destructive">
                      {renderError(response.error)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!response && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-6xl mb-4">⚡</div>
                <p>Execute a request to see the response here</p>
              </div>
            )}
          </div>

          {/* API Documentation */}
          <div className="bg-card rounded-lg shadow-md p-6 border">
            <h3 className="text-lg font-semibold mb-4 text-card-foreground">
              Available Endpoints
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    GET
                  </span>
                  <code className="text-sm font-mono text-foreground">
                    /apis/v1/center-lookup?number=:number
                  </code>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Lookup center by number
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    GET
                  </span>
                  <code className="text-sm font-mono text-foreground">
                    /apis/v1/dispute-center/:id
                  </code>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Get dispute center by ID
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    POST
                  </span>
                  <code className="text-sm font-mono text-foreground">
                    /apis/v1/dispute-center
                  </code>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Create new dispute center
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    PUT
                  </span>
                  <code className="text-sm font-mono text-foreground">
                    /apis/v1/dispute-center/:id
                  </code>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Update dispute center
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                    DELETE
                  </span>
                  <code className="text-sm font-mono text-foreground">
                    /apis/v1/dispute-center/:id
                  </code>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Delete dispute center
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
