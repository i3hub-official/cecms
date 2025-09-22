"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Key,
  Settings,
  History,
  BookOpen,
  Zap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Smartphone,
} from "lucide-react";

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

interface SavedToken {
  name: string;
  key: string;
  lastUsed: string;
}

export default function ApiPlaygroundPage() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [rememberKey, setRememberKey] = useState(false);
  const [savedKeys, setSavedKeys] = useState<SavedToken[]>([]);
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
  const [activeTab, setActiveTab] = useState<"request" | "history" | "docs">(
    "request"
  );
  const [showSavedKeys, setShowSavedKeys] = useState(false);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [showSaveKeyModal, setShowSaveKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const historyPerPage = 10;

  useEffect(() => {
    loadSavedKeys();
    loadHistory();

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
            (a: SavedToken, b: SavedToken) =>
              new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
          )[0];
          setToken(mostRecent.key);
          setRememberKey(true);
        }
      }
    } catch (error) {
      console.error("Failed to load saved API keys:", error);
    }
  };

  const saveToken = () => {
    if (!token.trim()) return;
    setShowSaveKeyModal(true);
  };

  const confirmSaveToken = () => {
    if (!token.trim() || !keyName.trim()) return;

    const newKey: SavedToken = {
      name: keyName.trim(),
      key: token,
      lastUsed: new Date().toISOString(),
    };

    const updatedKeys = [
      newKey,
      ...savedKeys.filter((k) => k.key !== token),
    ].slice(0, 5);

    localStorage.setItem("apiPlaygroundSavedKeys", JSON.stringify(updatedKeys));
    setSavedKeys(updatedKeys);
    setShowSaveKeyModal(false);
    setKeyName("");
    alert("API key saved securely!");
  };

  const removeSavedKey = (keyToRemove: string) => {
    const updatedKeys = savedKeys.filter((k) => k.key !== keyToRemove);
    localStorage.setItem("apiPlaygroundSavedKeys", JSON.stringify(updatedKeys));
    setSavedKeys(updatedKeys);

    if (token === keyToRemove) {
      setToken("");
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
      ...history.slice(0, 99), // Keep max 100 history items
    ];
    setHistory(newHistory);
    localStorage.setItem("apiPlaygroundHistory", JSON.stringify(newHistory));
  };

  const executeRequest = async () => {
    if (!token.trim()) {
      setResponse({ success: false, error: "API key is required" });
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

      const headers: HeadersInit = { Authorization: `Bearer ${token}` };

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

      const response = await fetch(url, options);
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
        { url, method, headers, body: requestBody },
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
      setResponse({ success: false, error: errorMessage });
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
      if (typeof obj === "string") return obj;
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const presetEndpoints = [
    {
      value: "/apis/v1/center-lookup?number=",
      label: "Center Lookup",
      method: "GET",
    },
    {
      value: "/apis/v1/dispute-center/",
      label: "Get Dispute Center",
      method: "GET",
    },
    {
      value: "/apis/v1/dispute-center",
      label: "List Dispute Centers",
      method: "GET",
    },
    { value: "/apis/v1/helper/", label: "Helper Endpoint", method: "GET" },
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

  const methodColors = {
    GET: "bg-emerald-100 text-emerald-800 border-emerald-200",
    POST: "bg-blue-100 text-blue-800 border-blue-200",
    PUT: "bg-amber-100 text-amber-800 border-amber-200",
    PATCH: "bg-purple-100 text-purple-800 border-purple-200",
    DELETE: "bg-red-100 text-red-800 border-red-200",
  };

  // Pagination logic
  const totalHistoryPages = Math.ceil(history.length / historyPerPage);
  const startIndex = (currentHistoryPage - 1) * historyPerPage;
  const endIndex = startIndex + historyPerPage;
  const currentHistoryItems = history.slice(startIndex, endIndex);

  const apiDocs = [
    {
      method: "GET",
      endpoint: "/apis/v1/center-lookup?number=:number",
      description: "Lookup center by number",
    },
    {
      method: "GET",
      endpoint: "/apis/v1/dispute-center/:id",
      description: "Get dispute center by ID",
    },
    {
      method: "POST",
      endpoint: "/apis/v1/dispute-center",
      description: "Create new dispute center",
    },
    {
      method: "PUT",
      endpoint: "/apis/v1/dispute-center/:id",
      description: "Update dispute center",
    },
    {
      method: "DELETE",
      endpoint: "/apis/v1/dispute-center/:id",
      description: "Delete dispute center",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/50 to-muted/30 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Save Key Name Modal */}
        {showSaveKeyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl border">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Key className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-card-foreground">
                  Save API Key
                </h3>
              </div>
              <p className="mb-4 text-sm sm:text-base text-muted-foreground">
                Enter a name for this API key to easily identify it later.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder='e.g., "Production", "Testing", "Development"'
                  className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && keyName.trim()) {
                      confirmSaveToken();
                    }
                    if (e.key === 'Escape') {
                      setShowSaveKeyModal(false);
                      setKeyName("");
                    }
                  }}
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
                <button
                  onClick={() => {
                    setShowSaveKeyModal(false);
                    setKeyName("");
                  }}
                  className="px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveToken}
                  disabled={!keyName.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Warning Modal */}
        {showSecurityWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-warning">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/20 rounded-full flex items-center justify-center">
                  <Key className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-card-foreground">
                  Security Warning
                </h3>
              </div>
              <p className="mb-4 text-sm sm:text-base text-card-foreground/80">
                Storing API keys in your browser is convenient but has security
                risks:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1 text-sm text-muted-foreground">
                <li>
                  Anyone with access to your computer can see your API keys
                </li>
                <li>
                  Malicious browser extensions could potentially read stored
                  keys
                </li>
                <li>
                  If your computer is compromised, your API keys could be stolen
                </li>
              </ul>
              <p className="mb-6 font-medium text-sm sm:text-base text-card-foreground">
                Only save API keys if you understand and accept these risks.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
                <button
                  onClick={() => setShowSecurityWarning(false)}
                  className="px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setRememberKey(true);
                    setShowSecurityWarning(false);
                    saveToken();
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  I Understand, Save Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-card rounded-xl shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">
                  API Testing Hub
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Build, test, and debug your API endpoints with ease
                </p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = "/admin/getApi")}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center sm:justify-start space-x-2 font-medium"
            >
              <Key className="w-4 h-4" />
              <span>API Key Manager</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Request Configuration */}
          <div className="space-y-4 sm:space-y-6">
            {/* Tab Navigation */}
            <div className="bg-card rounded-xl shadow-sm border">
              <div className="border-b border-border">
                <nav className="flex px-2 sm:px-6 overflow-x-auto" aria-label="Tabs">
                  {[
                    { id: "request", label: "Request", icon: Settings },
                    { id: "history", label: "History", icon: History },
                    { id: "docs", label: "Docs", icon: BookOpen },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`${
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors flex-shrink-0`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-3 sm:p-6">
                {activeTab === "request" && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Authentication Section */}
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-card-foreground flex items-center space-x-2">
                        <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Authentication</span>
                      </h3>

                      {/* Auth Method Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { value: "authorization", label: "Bearer Token" },
                          { value: "x-api-key", label: "X-API-Key" },
                        ].map((method) => (
                          <button
                            key={method.value}
                            onClick={() => {
                              setAuthMethod(method.value as any);
                              localStorage.setItem(
                                "apiPlaygroundAuthMethod",
                                method.value
                              );
                            }}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                              authMethod === method.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>

                      {/* API Key Input */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-card-foreground">
                            API Key{" "}
                            {authMethod === "authorization"
                              ? "(Bearer Token)"
                              : "(X-API-Key)"}
                          </label>
                          {savedKeys.length > 0 && (
                            <button
                              onClick={() => setShowSavedKeys(!showSavedKeys)}
                              className="text-sm text-primary hover:text-primary/80 flex items-center space-x-1"
                            >
                              <span>Saved Keys</span>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  showSavedKeys ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {showSavedKeys && savedKeys.length > 0 && (
                          <div className="bg-muted rounded-lg p-3 space-y-2">
                            {savedKeys.map((savedKey, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-background rounded border hover:shadow-sm transition-shadow"
                              >
                                <button
                                  onClick={() => {
                                    setToken(savedKey.key);
                                    setRememberKey(true);
                                    setShowSavedKeys(false);
                                  }}
                                  className="flex-1 text-left"
                                >
                                  <div className="font-medium text-sm text-card-foreground">
                                    {savedKey.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    ••••{savedKey.key.slice(-4)}
                                  </div>
                                </button>
                                <button
                                  onClick={() => removeSavedKey(savedKey.key)}
                                  className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="relative">
                          <input
                            type={showToken ? "text" : "password"}
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder={
                              authMethod === "authorization"
                                ? "Enter your Bearer token"
                                : "Enter your API key (starts with sk_...)"
                            }
                            className="w-full p-3 pr-20 border border-input rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                            <button
                              onClick={() => setShowToken(!showToken)}
                              className="p-1 text-muted-foreground hover:text-foreground"
                            >
                              {showToken ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            {token && (
                              <button
                                onClick={() => copyToClipboard(token)}
                                className="p-1 text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

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
                            className="rounded border-input text-primary focus:ring-primary"
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
                              onClick={saveToken}
                              className="px-3 py-2 bg-success text-success-foreground text-sm rounded-lg hover:bg-success/90 transition-colors flex items-center space-x-2"
                            >
                              <Key className="w-4 h-4" />
                              <span>Save Key Now</span>
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Request Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-card-foreground">
                        Request Configuration
                      </h3>

                      {/* Method and Endpoint */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-card-foreground mb-2">
                            Method
                          </label>
                          <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-card-foreground mb-2">
                            Endpoint
                          </label>
                          <div className="space-y-2">
                            <select
                              value={endpoint}
                              onChange={(e) => {
                                const preset = presetEndpoints.find(
                                  (p) => p.value === e.target.value
                                );
                                setEndpoint(e.target.value);
                                if (preset) setMethod(preset.method);
                              }}
                              className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            >
                              {presetEndpoints.map((preset) => (
                                <option key={preset.value} value={preset.value}>
                                  {preset.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={endpoint}
                              onChange={(e) => setEndpoint(e.target.value)}
                              placeholder="Enter custom endpoint"
                              className="w-full p-3 border border-input rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Request Body */}
                      {(method === "POST" ||
                        method === "PUT" ||
                        method === "PATCH") && (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <label className="block text-sm font-medium text-card-foreground">
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
                              className="px-3 py-1 border border-input rounded-md text-sm bg-background text-foreground"
                            >
                              <option value="">Choose preset...</option>
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
                            rows={6}
                            className={`w-full p-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
                              requestBody && !isValidJson(requestBody)
                                ? "border-destructive focus:border-destructive focus:ring-destructive"
                                : "border-input focus:border-transparent"
                            }`}
                          />
                          {requestBody && !isValidJson(requestBody) && (
                            <p className="text-destructive text-sm flex items-center space-x-1">
                              <XCircle className="w-4 h-4" />
                              <span>Invalid JSON format</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Execute Button */}
                    <button
                      onClick={executeRequest}
                      disabled={
                        loading ||
                        !token.trim() ||
                        (!!requestBody && !isValidJson(requestBody))
                      }
                      className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-medium"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                          <span>Sending Request...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          <span>Execute Request</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold text-card-foreground flex items-center space-x-2">
                        <History className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Request History</span>
                      </h3>
                      {history.length > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {history.length} total
                        </span>
                      )}
                    </div>
                    
                    {currentHistoryItems.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          {currentHistoryItems.map((item, index) => (
                            <div
                              key={startIndex + index}
                              className="p-3 sm:p-4 border border-border rounded-lg cursor-pointer hover:border-border/80 hover:shadow-sm transition-all bg-background"
                              onClick={() => {
                                setEndpoint(
                                  item.request.url.replace(
                                    "https://192.168.0.159:3002",
                                    ""
                                  ).replace(window.location.origin, "")
                                );
                                setMethod(item.request.method);
                                setRequestBody(item.request.body || "");
                                setResponse(item.response);
                                setActiveTab("request");
                              }}
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-1 sm:space-y-0">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium border w-fit ${
                                    methodColors[
                                      item.request
                                        .method as keyof typeof methodColors
                                    ] || methodColors.GET
                                  }`}
                                >
                                  {item.request.method}
                                </span>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  {item.response.success ? (
                                    <CheckCircle className="w-4 h-4 text-success" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-destructive" />
                                  )}
                                  <span>
                                    {new Date(
                                      item.timestamp
                                    ).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm font-mono mb-1 text-card-foreground truncate">
                                {item.request.url.replace(
                                  "https://192.168.0.159:3002",
                                  ""
                                ).replace(window.location.origin, "")}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Pagination */}
                        {totalHistoryPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="text-sm text-muted-foreground">
                              Page {currentHistoryPage} of {totalHistoryPages}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setCurrentHistoryPage(prev => Math.max(1, prev - 1))}
                                disabled={currentHistoryPage === 1}
                                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent rounded-lg transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-sm text-muted-foreground">
                                {startIndex + 1}-{Math.min(endIndex, history.length)} of {history.length}
                              </span>
                              <button
                                onClick={() => setCurrentHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                                disabled={currentHistoryPage === totalHistoryPages}
                                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent rounded-lg transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p>No requests made yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "docs" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold text-card-foreground flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>API Documentation</span>
                      </h3>
                      <button
                        onClick={() => copyToClipboard(
                          apiDocs.map(api => 
                            `${api.method} ${api.endpoint}\n${api.description}\n`
                          ).join('\n')
                        )}
                        className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span className="hidden sm:inline">Copy All</span>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {apiDocs.map((api, index) => (
                        <div
                          key={index}
                          className="p-3 sm:p-4 border border-border rounded-lg hover:border-border/80 transition-colors bg-background group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium border w-fit ${
                                methodColors[
                                  api.method as keyof typeof methodColors
                                ] || methodColors.GET
                              }`}
                            >
                              {api.method}
                            </span>
                            <code className="text-sm font-mono text-card-foreground bg-muted px-2 py-1 rounded break-all">
                              {api.endpoint}
                            </code>
                            <button
                              onClick={() => copyToClipboard(`${api.method} ${api.endpoint}\n${api.description}`)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all ml-auto"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {api.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Response */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-card rounded-xl shadow-sm border p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-card-foreground flex items-center space-x-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-lg flex items-center justify-center">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  </div>
                  <span>Response</span>
                </h2>
                {response && (
                  <button
                    onClick={() => copyToClipboard(formatJson(response))}
                    className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors flex items-center space-x-1 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                )}
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12 sm:py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground text-sm sm:text-base">Sending request...</p>
                  </div>
                </div>
              )}

              {response && !loading && (
                <div className="space-y-4">
                  {/* Status and Timing */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      {response.success ? (
                        <div className="flex items-center space-x-2 text-success">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="font-medium text-sm sm:text-base">Success</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-destructive">
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="font-medium text-sm sm:text-base">Error</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {responseTime.toFixed(0)} ms
                      </span>
                    </div>
                  </div>

                  {/* Rate Limit Info */}
                  {response.metadata?.rateLimit && (
                    <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center space-x-2 text-primary mb-2">
                        <div className="w-4 h-4 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium">
                          Rate Limit: {response.metadata.rateLimit.remaining} /{" "}
                          {response.metadata.rateLimit.limit} remaining
                        </span>
                      </div>
                      <div className="w-full bg-primary/20 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              (response.metadata.rateLimit.remaining /
                                response.metadata.rateLimit.limit) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Response Data */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-card-foreground">
                      Response Body
                    </label>
                    <div className="relative">
                      <pre className="bg-muted text-card-foreground p-3 sm:p-4 rounded-lg overflow-auto max-h-64 sm:max-h-96 text-xs sm:text-sm font-mono">
                        {formatJson(response)}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(formatJson(response))}
                        className="absolute top-2 right-2 p-2 bg-muted-foreground hover:bg-foreground rounded text-background transition-colors"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Error Details */}
                  {response.error && (
                    <div className="p-3 sm:p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                        <h4 className="font-medium text-destructive text-sm sm:text-base">
                          Response Details
                        </h4>
                      </div>
                      <p className="text-destructive text-xs sm:text-sm font-mono bg-destructive/10 p-3 rounded border border-destructive/20 break-words">
                        {typeof response.error === "string"
                          ? response.error
                          : JSON.stringify(response.error, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!response && !loading && (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-card-foreground mb-2">
                    Ready to test your API
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Configure your request and hit execute to see the response
                    here
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-4 flex items-center space-x-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary text-xs sm:text-sm">💡</span>
                </div>
                <span>Pro Tips</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                  <span>
                    Use the history tab to quickly replay previous requests
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                  <span>Save frequently used API keys for faster testing</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                  <span>
                    Check the docs tab for available endpoint reference
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                  <span>
                    Copy response data using the copy button for further
                    analysis
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Stats - Moved below playground */}
        {history.length > 0 && (
          <div className="mt-6 bg-card rounded-xl shadow-sm border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-4">
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 sm:p-4 bg-success/10 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-success">
                  {history.filter((h) => h.response.success).length}
                </div>
                <div className="text-xs sm:text-sm text-success">Successful</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-destructive/10 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-destructive">
                  {history.filter((h) => !h.response.success).length}
                </div>
                <div className="text-xs sm:text-sm text-destructive">Failed</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-primary/10 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {history.length}
                </div>
                <div className="text-xs sm:text-sm text-primary">Total</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                  {history.length > 0 
                    ? Math.round((history.filter((h) => h.response.success).length / history.length) * 100)
                    : 0}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// "use client";

// import { useState, useEffect } from "react";
// import {
//   ChevronDown,
//   Copy,
//   Eye,
//   EyeOff,
//   Trash2,
//   Play,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Key,
//   Settings,
//   History,
//   BookOpen,
//   Zap,
// } from "lucide-react";

// interface ApiResponse {
//   success: boolean;
//   data?: any;
//   error?: string;
//   metadata?: {
//     timestamp: string;
//     rateLimit?: {
//       remaining: number;
//       limit: number;
//     };
//   };
// }

// interface SavedToken {
//   name: string;
//   key: string;
//   lastUsed: string;
// }

// export default function ApiPlaygroundPage() {
//   const [token, setToken] = useState("");
//   const [showToken, setShowToken] = useState(false);
//   const [rememberKey, setRememberKey] = useState(false);
//   const [savedKeys, setSavedKeys] = useState<SavedToken[]>([]);
//   const [endpoint, setEndpoint] = useState("/apis/v1/center-lookup?number=");
//   const [method, setMethod] = useState("GET");
//   const [requestBody, setRequestBody] = useState("");
//   const [response, setResponse] = useState<ApiResponse | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [responseTime, setResponseTime] = useState(0);
//   const [history, setHistory] = useState<any[]>([]);
//   const [showSecurityWarning, setShowSecurityWarning] = useState(false);
//   const [authMethod, setAuthMethod] = useState<"x-api-key" | "authorization">(
//     "authorization"
//   );
//   const [activeTab, setActiveTab] = useState<"request" | "history" | "docs">(
//     "request"
//   );
//   const [showSavedKeys, setShowSavedKeys] = useState(false);

//   useEffect(() => {
//     loadSavedKeys();
//     loadHistory();

//     const savedAuthMethod = localStorage.getItem("apiPlaygroundAuthMethod");
//     if (savedAuthMethod) {
//       setAuthMethod(savedAuthMethod as "x-api-key" | "authorization");
//     }
//   }, []);

//   const loadSavedKeys = () => {
//     try {
//       const saved = localStorage.getItem("apiPlaygroundSavedKeys");
//       if (saved) {
//         const keys = JSON.parse(saved);
//         setSavedKeys(keys);

//         if (keys.length > 0) {
//           const mostRecent = keys.sort(
//             (a: SavedToken, b: SavedToken) =>
//               new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
//           )[0];
//           setToken(mostRecent.key);
//           setRememberKey(true);
//         }
//       }
//     } catch (error) {
//       console.error("Failed to load saved API keys:", error);
//     }
//   };

//   const saveToken = () => {
//     if (!token.trim()) return;

//     const keyName =
//       prompt(
//         'Enter a name for this API key (e.g., "Production", "Testing"):'
//       ) || "Unnamed Key";

//     const newKey: SavedToken = {
//       name: keyName,
//       key: token,
//       lastUsed: new Date().toISOString(),
//     };

//     const updatedKeys = [
//       newKey,
//       ...savedKeys.filter((k) => k.key !== token),
//     ].slice(0, 5);

//     localStorage.setItem("apiPlaygroundSavedKeys", JSON.stringify(updatedKeys));
//     setSavedKeys(updatedKeys);
//     alert("API key saved securely!");
//   };

//   const removeSavedKey = (keyToRemove: string) => {
//     const updatedKeys = savedKeys.filter((k) => k.key !== keyToRemove);
//     localStorage.setItem("apiPlaygroundSavedKeys", JSON.stringify(updatedKeys));
//     setSavedKeys(updatedKeys);

//     if (token === keyToRemove) {
//       setToken("");
//       setRememberKey(false);
//     }
//   };

//   const loadHistory = () => {
//     try {
//       const savedHistory = localStorage.getItem("apiPlaygroundHistory");
//       if (savedHistory) {
//         setHistory(JSON.parse(savedHistory));
//       }
//     } catch (error) {
//       console.error("Failed to load history:", error);
//     }
//   };

//   const saveToHistory = (request: any, response: any) => {
//     const newHistory = [
//       { timestamp: new Date().toISOString(), request, response },
//       ...history.slice(0, 9),
//     ];
//     setHistory(newHistory);
//     localStorage.setItem("apiPlaygroundHistory", JSON.stringify(newHistory));
//   };

//   const executeRequest = async () => {
//     if (!token.trim()) {
//       setResponse({ success: false, error: "API key is required" });
//       return;
//     }

//     setLoading(true);
//     setResponse(null);
//     setResponseTime(0);

//     const startTime = performance.now();

//     try {
//       const baseUrl =
//         process.env.NODE_ENV === "production"
//           ? window.location.origin
//           : "https://192.168.0.159:3002";
//       const url = `${baseUrl}${endpoint}`;

//       const headers: HeadersInit = { Authorization: `Bearer ${token}` };

//       if (method !== "GET" && requestBody) {
//         headers["Content-Type"] = "application/json";
//       }

//       const options: RequestInit = { method, headers, credentials: "omit" };

//       if (method !== "GET" && requestBody) {
//         if (!isValidJson(requestBody)) {
//           throw new Error("Invalid JSON in request body");
//         }
//         options.body = requestBody;
//       }

//       const response = await fetch(url, options);
//       let data;

//       try {
//         data = await response.json();
//       } catch (jsonError) {
//         const text = await response.text();
//         data = {
//           success: false,
//           error: `Invalid JSON response: ${text.substring(0, 100)}...`,
//         };
//       }

//       const endTime = performance.now();

//       const formattedResponse: ApiResponse = {
//         success: data?.success || false,
//         data: data?.data,
//         error:
//           typeof data?.error === "string"
//             ? data.error
//             : data?.error?.message
//             ? data.error.message
//             : data?.error
//             ? JSON.stringify(data.error)
//             : data?.message || undefined,
//         metadata: data?.metadata,
//       };

//       setResponse(formattedResponse);
//       setResponseTime(endTime - startTime);

//       saveToHistory(
//         { url, method, headers, body: requestBody },
//         formattedResponse
//       );

//       if (savedKeys.some((k) => k.key === token)) {
//         const updatedKeys = savedKeys.map((k) =>
//           k.key === token ? { ...k, lastUsed: new Date().toISOString() } : k
//         );
//         localStorage.setItem(
//           "apiPlaygroundSavedKeys",
//           JSON.stringify(updatedKeys)
//         );
//         setSavedKeys(updatedKeys);
//       }
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error ? error.message : "Request failed";
//       setResponse({ success: false, error: errorMessage });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isValidJson = (str: string): boolean => {
//     try {
//       if (str.trim() === "") return true;
//       JSON.parse(str);
//       return true;
//     } catch {
//       return false;
//     }
//   };

//   const formatJson = (obj: any) => {
//     try {
//       if (typeof obj === "string") return obj;
//       return JSON.stringify(obj, null, 2);
//     } catch {
//       return String(obj);
//     }
//   };

//   const copyToClipboard = (text: string) => {
//     navigator.clipboard.writeText(text);
//   };

//   const presetEndpoints = [
//     {
//       value: "/apis/v1/center-lookup?number=",
//       label: "Center Lookup",
//       method: "GET",
//     },
//     {
//       value: "/apis/v1/dispute-center/",
//       label: "Get Dispute Center",
//       method: "GET",
//     },
//     {
//       value: "/apis/v1/dispute-center",
//       label: "List Dispute Centers",
//       method: "GET",
//     },
//     { value: "/apis/v1/helper/", label: "Helper Endpoint", method: "GET" },
//   ];

//   const presetBodies = {
//     "POST /dispute-center": JSON.stringify(
//       {
//         name: "New Dispute Center",
//         address: "123 Main Street",
//         state: "Lagos",
//         lga: "Ikeja",
//         email: "center@example.com",
//         phone: "+2348000000000",
//       },
//       null,
//       2
//     ),
//     "PUT /dispute-center": JSON.stringify(
//       {
//         name: "Updated Center Name",
//         address: "456 Updated Street",
//       },
//       null,
//       2
//     ),
//   };

//   const methodColors = {
//     GET: "bg-emerald-100 text-emerald-800 border-emerald-200",
//     POST: "bg-blue-100 text-blue-800 border-blue-200",
//     PUT: "bg-amber-100 text-amber-800 border-amber-200",
//     PATCH: "bg-purple-100 text-purple-800 border-purple-200",
//     DELETE: "bg-red-100 text-red-800 border-red-200",
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background/50 to-muted/30 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Security Warning Modal */}
//         {showSecurityWarning && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
//             <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-warning">
//               <div className="flex items-center space-x-3 mb-4">
//                 <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
//                   <Key className="w-6 h-6 text-warning" />
//                 </div>
//                 <h3 className="text-xl font-bold text-card-foreground">
//                   Security Warning
//                 </h3>
//               </div>
//               <p className="mb-4 text-card-foreground/80">
//                 Storing API keys in your browser is convenient but has security
//                 risks:
//               </p>
//               <ul className="list-disc list-inside mb-4 space-y-1 text-sm text-muted-foreground">
//                 <li>
//                   Anyone with access to your computer can see your API keys
//                 </li>
//                 <li>
//                   Malicious browser extensions could potentially read stored
//                   keys
//                 </li>
//                 <li>
//                   If your computer is compromised, your API keys could be stolen
//                 </li>
//               </ul>
//               <p className="mb-6 font-medium text-card-foreground">
//                 Only save API keys if you understand and accept these risks.
//               </p>
//               <div className="flex space-x-3 justify-end">
//                 <button
//                   onClick={() => setShowSecurityWarning(false)}
//                   className="px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-accent transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={() => {
//                     setRememberKey(true);
//                     setShowSecurityWarning(false);
//                     saveToken();
//                   }}
//                   className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
//                 >
//                   I Understand, Save Key
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Header */}
//         <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div>
//                 <h1 className="text-3xl font-bold text-card-foreground">
//                   API Playground
//                 </h1>
//                 <p className="text-muted-foreground mt-1">
//                   Test and explore your API endpoints in real-time
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => (window.location.href = "/admin/getApi")}
//               className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
//             >
//               <Key className="w-4 h-4" />
//               <span>Manage Keys</span>
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//           {/* Left Column - Request Configuration */}
//           <div className="space-y-6">
//             {/* Tab Navigation */}
//             <div className="bg-card rounded-xl shadow-sm border">
//               <div className="border-b border-border">
//                 <nav className="flex space-x-8 px-6" aria-label="Tabs">
//                   {[
//                     { id: "request", label: "Request", icon: Settings },
//                     { id: "history", label: "History", icon: History },
//                     { id: "docs", label: "Docs", icon: BookOpen },
//                   ].map((tab) => (
//                     <button
//                       key={tab.id}
//                       onClick={() => setActiveTab(tab.id as any)}
//                       className={`${
//                         activeTab === tab.id
//                           ? "border-primary text-primary"
//                           : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
//                       } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
//                     >
//                       <tab.icon className="w-4 h-4" />
//                       <span>{tab.label}</span>
//                     </button>
//                   ))}
//                 </nav>
//               </div>

//               <div className="p-6">
//                 {activeTab === "request" && (
//                   <div className="space-y-6">
//                     {/* Authentication Section */}
//                     <div className="space-y-4">
//                       <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
//                         <Key className="w-5 h-5" />
//                         <span>Authentication</span>
//                       </h3>

//                       {/* Auth Method Selection */}
//                       <div className="grid grid-cols-2 gap-3">
//                         {[
//                           { value: "authorization", label: "Bearer Token" },
//                           { value: "x-api-key", label: "X-API-Key" },
//                         ].map((method) => (
//                           <button
//                             key={method.value}
//                             onClick={() => {
//                               setAuthMethod(method.value as any);
//                               localStorage.setItem(
//                                 "apiPlaygroundAuthMethod",
//                                 method.value
//                               );
//                             }}
//                             className={`p-3 rounded-lg border text-sm font-medium transition-all ${
//                               authMethod === method.value
//                                 ? "border-primary bg-primary/10 text-primary"
//                                 : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
//                             }`}
//                           >
//                             {method.label}
//                           </button>
//                         ))}
//                       </div>

//                       {/* API Key Input */}
//                       <div className="space-y-3">
//                         <div className="flex items-center justify-between">
//                           <label className="block text-sm font-medium text-card-foreground">
//                             API Key{" "}
//                             {authMethod === "authorization"
//                               ? "(Bearer Token)"
//                               : "(X-API-Key)"}
//                           </label>
//                           {savedKeys.length > 0 && (
//                             <button
//                               onClick={() => setShowSavedKeys(!showSavedKeys)}
//                               className="text-sm text-primary hover:text-primary/80 flex items-center space-x-1"
//                             >
//                               <span>Saved Keys</span>
//                               <ChevronDown
//                                 className={`w-4 h-4 transition-transform ${
//                                   showSavedKeys ? "rotate-180" : ""
//                                 }`}
//                               />
//                             </button>
//                           )}
//                         </div>

//                         {showSavedKeys && savedKeys.length > 0 && (
//                           <div className="bg-muted rounded-lg p-3 space-y-2">
//                             {savedKeys.map((savedKey, index) => (
//                               <div
//                                 key={index}
//                                 className="flex items-center justify-between p-2 bg-background rounded border hover:shadow-sm transition-shadow"
//                               >
//                                 <button
//                                   onClick={() => {
//                                     setToken(savedKey.key);
//                                     setRememberKey(true);
//                                     setShowSavedKeys(false);
//                                   }}
//                                   className="flex-1 text-left"
//                                 >
//                                   <div className="font-medium text-sm text-card-foreground">
//                                     {savedKey.name}
//                                   </div>
//                                   <div className="text-xs text-muted-foreground font-mono">
//                                     ••••{savedKey.key.slice(-4)}
//                                   </div>
//                                 </button>
//                                 <button
//                                   onClick={() => removeSavedKey(savedKey.key)}
//                                   className="p-1 text-destructive hover:bg-destructive/10 rounded"
//                                 >
//                                   <Trash2 className="w-4 h-4" />
//                                 </button>
//                               </div>
//                             ))}
//                           </div>
//                         )}

//                         <div className="relative">
//                           <input
//                             type={showToken ? "text" : "password"}
//                             value={token}
//                             onChange={(e) => setToken(e.target.value)}
//                             placeholder={
//                               authMethod === "authorization"
//                                 ? "Enter your Bearer token"
//                                 : "Enter your API key (starts with sk_...)"
//                             }
//                             className="w-full p-3 pr-20 border border-input rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
//                           />
//                           <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
//                             <button
//                               onClick={() => setShowToken(!showToken)}
//                               className="p-1 text-muted-foreground hover:text-foreground"
//                             >
//                               {showToken ? (
//                                 <EyeOff className="w-4 h-4" />
//                               ) : (
//                                 <Eye className="w-4 h-4" />
//                               )}
//                             </button>
//                             {token && (
//                               <button
//                                 onClick={() => copyToClipboard(token)}
//                                 className="p-1 text-muted-foreground hover:text-foreground"
//                               >
//                                 <Copy className="w-4 h-4" />
//                               </button>
//                             )}
//                           </div>
//                         </div>

//                         <div className="flex items-center space-x-2">
//                           <input
//                             type="checkbox"
//                             id="rememberKey"
//                             checked={rememberKey}
//                             onChange={(e) => {
//                               if (e.target.checked) {
//                                 setShowSecurityWarning(true);
//                               } else {
//                                 setRememberKey(false);
//                                 if (savedKeys.some((k) => k.key === token)) {
//                                   removeSavedKey(token);
//                                 }
//                               }
//                             }}
//                             className="rounded border-input text-primary focus:ring-primary"
//                           />
//                           <label
//                             htmlFor="rememberKey"
//                             className="text-sm text-muted-foreground"
//                           >
//                             Save this key for future use
//                           </label>
//                         </div>

//                         {rememberKey &&
//                           token &&
//                           !savedKeys.some((k) => k.key === token) && (
//                             <button
//                               onClick={saveToken}
//                               className="px-3 py-2 bg-success text-success-foreground text-sm rounded-lg hover:bg-success/90 transition-colors flex items-center space-x-2"
//                             >
//                               <Key className="w-4 h-4" />
//                               <span>Save Key Now</span>
//                             </button>
//                           )}
//                       </div>
//                     </div>

//                     {/* Request Configuration */}
//                     <div className="space-y-4">
//                       <h3 className="text-lg font-semibold text-card-foreground">
//                         Request Configuration
//                       </h3>

//                       {/* Method and Endpoint */}
//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-card-foreground mb-2">
//                             Method
//                           </label>
//                           <select
//                             value={method}
//                             onChange={(e) => setMethod(e.target.value)}
//                             className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
//                           >
//                             <option value="GET">GET</option>
//                             <option value="POST">POST</option>
//                             <option value="PUT">PUT</option>
//                             <option value="PATCH">PATCH</option>
//                             <option value="DELETE">DELETE</option>
//                           </select>
//                         </div>

//                         <div className="md:col-span-2">
//                           <label className="block text-sm font-medium text-card-foreground mb-2">
//                             Endpoint
//                           </label>
//                           <div className="space-y-2">
//                             <select
//                               value={endpoint}
//                               onChange={(e) => {
//                                 const preset = presetEndpoints.find(
//                                   (p) => p.value === e.target.value
//                                 );
//                                 setEndpoint(e.target.value);
//                                 if (preset) setMethod(preset.method);
//                               }}
//                               className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
//                             >
//                               {presetEndpoints.map((preset) => (
//                                 <option key={preset.value} value={preset.value}>
//                                   {preset.label}
//                                 </option>
//                               ))}
//                             </select>
//                             <input
//                               type="text"
//                               value={endpoint}
//                               onChange={(e) => setEndpoint(e.target.value)}
//                               placeholder="Enter custom endpoint"
//                               className="w-full p-3 border border-input rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
//                             />
//                           </div>
//                         </div>
//                       </div>

//                       {/* Request Body */}
//                       {(method === "POST" ||
//                         method === "PUT" ||
//                         method === "PATCH") && (
//                         <div className="space-y-3">
//                           <div className="flex items-center justify-between">
//                             <label className="block text-sm font-medium text-card-foreground">
//                               Request Body
//                             </label>
//                             <select
//                               onChange={(e) =>
//                                 setRequestBody(
//                                   presetBodies[
//                                     e.target.value as keyof typeof presetBodies
//                                   ] || ""
//                                 )
//                               }
//                               className="px-3 py-1 border border-input rounded-md text-sm bg-background text-foreground"
//                             >
//                               <option value="">Choose preset...</option>
//                               <option value="POST /dispute-center">
//                                 POST /dispute-center
//                               </option>
//                               <option value="PUT /dispute-center">
//                                 PUT /dispute-center
//                               </option>
//                             </select>
//                           </div>
//                           <textarea
//                             value={requestBody}
//                             onChange={(e) => setRequestBody(e.target.value)}
//                             placeholder="Enter JSON request body"
//                             rows={8}
//                             className={`w-full p-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
//                               requestBody && !isValidJson(requestBody)
//                                 ? "border-destructive focus:border-destructive focus:ring-destructive"
//                                 : "border-input focus:border-transparent"
//                             }`}
//                           />
//                           {requestBody && !isValidJson(requestBody) && (
//                             <p className="text-destructive text-sm flex items-center space-x-1">
//                               <XCircle className="w-4 h-4" />
//                               <span>Invalid JSON format</span>
//                             </p>
//                           )}
//                         </div>
//                       )}
//                     </div>

//                     {/* Execute Button */}
//                     <button
//                       onClick={executeRequest}
//                       disabled={
//                         loading ||
//                         !token.trim() ||
//                         (!!requestBody && !isValidJson(requestBody))
//                       }
//                       className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-medium"
//                     >
//                       {loading ? (
//                         <>
//                           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
//                           <span>Sending Request...</span>
//                         </>
//                       ) : (
//                         <>
//                           <Play className="w-5 h-5" />
//                           <span>Execute Request</span>
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 )}

//                 {activeTab === "history" && (
//                   <div className="space-y-4">
//                     <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
//                       <History className="w-5 h-5" />
//                       <span>Request History</span>
//                     </h3>
//                     {history.length > 0 ? (
//                       <div className="space-y-3">
//                         {history.map((item, index) => (
//                           <div
//                             key={index}
//                             className="p-4 border border-border rounded-lg cursor-pointer hover:border-border/80 hover:shadow-sm transition-all bg-background"
//                             onClick={() => {
//                               setEndpoint(
//                                 item.request.url.replace(
//                                   "https://192.168.0.159:3002",
//                                   ""
//                                 )
//                               );
//                               setMethod(item.request.method);
//                               setRequestBody(item.request.body || "");
//                               setResponse(item.response);
//                               setActiveTab("request");
//                             }}
//                           >
//                             <div className="flex justify-between items-start mb-2">
//                               <span
//                                 className={`px-2 py-1 rounded text-xs font-medium border ${
//                                   methodColors[
//                                     item.request
//                                       .method as keyof typeof methodColors
//                                   ] || methodColors.GET
//                                 }`}
//                               >
//                                 {item.request.method}
//                               </span>
//                               <div className="flex items-center space-x-2 text-xs text-muted-foreground">
//                                 {item.response.success ? (
//                                   <CheckCircle className="w-4 h-4 text-success" />
//                                 ) : (
//                                   <XCircle className="w-4 h-4 text-destructive" />
//                                 )}
//                                 <span>
//                                   {new Date(
//                                     item.timestamp
//                                   ).toLocaleTimeString()}
//                                 </span>
//                               </div>
//                             </div>
//                             <div className="text-sm font-mono mb-1 text-card-foreground truncate">
//                               {item.request.url.replace(
//                                 "https://192.168.0.159:3002",
//                                 ""
//                               )}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-center py-8 text-muted-foreground">
//                         <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
//                         <p>No requests made yet</p>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {activeTab === "docs" && (
//                   <div className="space-y-4">
//                     <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
//                       <BookOpen className="w-5 h-5" />
//                       <span>API Documentation</span>
//                     </h3>
//                     <div className="space-y-4">
//                       {[
//                         {
//                           method: "GET",
//                           endpoint: "/apis/v1/center-lookup?number=:number",
//                           description: "Lookup center by number",
//                         },
//                         {
//                           method: "GET",
//                           endpoint: "/apis/v1/dispute-center/:id",
//                           description: "Get dispute center by ID",
//                         },
//                         {
//                           method: "POST",
//                           endpoint: "/apis/v1/dispute-center",
//                           description: "Create new dispute center",
//                         },
//                         {
//                           method: "PUT",
//                           endpoint: "/apis/v1/dispute-center/:id",
//                           description: "Update dispute center",
//                         },
//                         {
//                           method: "DELETE",
//                           endpoint: "/apis/v1/dispute-center/:id",
//                           description: "Delete dispute center",
//                         },
//                       ].map((api, index) => (
//                         <div
//                           key={index}
//                           className="p-4 border border-border rounded-lg hover:border-border/80 transition-colors bg-background"
//                         >
//                           <div className="flex items-center space-x-3 mb-2">
//                             <span
//                               className={`px-2 py-1 rounded text-xs font-medium border ${
//                                 methodColors[
//                                   api.method as keyof typeof methodColors
//                                 ] || methodColors.GET
//                               }`}
//                             >
//                               {api.method}
//                             </span>
//                             <code className="text-sm font-mono text-card-foreground bg-muted px-2 py-1 rounded">
//                               {api.endpoint}
//                             </code>
//                           </div>
//                           <p className="text-sm text-muted-foreground">
//                             {api.description}
//                           </p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Response */}
//           <div className="space-y-6">
//             <div className="bg-card rounded-xl shadow-sm border p-6">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-semibold text-card-foreground flex items-center space-x-2">
//                   <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
//                     <Zap className="w-4 h-4 text-muted-foreground" />
//                   </div>
//                   <span>Response</span>
//                 </h2>
//                 {response && (
//                   <button
//                     onClick={() => copyToClipboard(formatJson(response))}
//                     className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors flex items-center space-x-1 text-sm"
//                   >
//                     <Copy className="w-4 h-4" />
//                     <span>Copy</span>
//                   </button>
//                 )}
//               </div>

//               {loading && (
//                 <div className="flex items-center justify-center py-16">
//                   <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
//                     <p className="text-muted-foreground">Sending request...</p>
//                   </div>
//                 </div>
//               )}

//               {response && !loading && (
//                 <div className="space-y-4">
//                   {/* Status and Timing */}
//                   <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
//                     <div className="flex items-center space-x-3">
//                       {response.success ? (
//                         <div className="flex items-center space-x-2 text-success">
//                           <CheckCircle className="w-5 h-5" />
//                           <span className="font-medium">Success</span>
//                         </div>
//                       ) : (
//                         <div className="flex items-center space-x-2 text-destructive">
//                           <XCircle className="w-5 h-5" />
//                           <span className="font-medium">Error</span>
//                         </div>
//                       )}
//                     </div>
//                     <div className="flex items-center space-x-2 text-muted-foreground">
//                       <Clock className="w-4 h-4" />
//                       <span className="text-sm">
//                         {responseTime.toFixed(0)} ms
//                       </span>
//                     </div>
//                   </div>

//                   {/* Rate Limit Info */}
//                   {response.metadata?.rateLimit && (
//                     <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
//                       <div className="flex items-center space-x-2 text-primary">
//                         <div className="w-4 h-4 bg-primary rounded-full"></div>
//                         <span className="text-sm font-medium">
//                           Rate Limit: {response.metadata.rateLimit.remaining} /{" "}
//                           {response.metadata.rateLimit.limit} remaining
//                         </span>
//                       </div>
//                       <div className="mt-2 w-full bg-primary/20 rounded-full h-2">
//                         <div
//                           className="bg-primary h-2 rounded-full transition-all duration-300"
//                           style={{
//                             width: `${
//                               (response.metadata.rateLimit.remaining /
//                                 response.metadata.rateLimit.limit) *
//                               100
//                             }%`,
//                           }}
//                         ></div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Response Data */}
//                   <div className="space-y-3">
//                     <label className="block text-sm font-medium text-card-foreground">
//                       Response Body
//                     </label>
//                     <div className="relative">
//                       <pre className="bg-muted text-card-foreground p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
//                         {formatJson(response)}
//                       </pre>
//                       <button
//                         onClick={() => copyToClipboard(formatJson(response))}
//                         className="absolute top-2 right-2 p-2 bg-muted-foreground hover:bg-foreground rounded text-background transition-colors"
//                       >
//                         <Copy className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>

//                   {/* Error Details */}
//                   {response.error && (
//                     <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
//                       <div className="flex items-center space-x-2 mb-2">
//                         <XCircle className="w-5 h-5 text-destructive" />
//                         <h4 className="font-medium text-destructive">
//                           Response Details
//                         </h4>
//                       </div>
//                       <p className="text-destructive text-sm font-mono bg-destructive/10 p-3 rounded border border-destructive/20">
//                         {typeof response.error === "string"
//                           ? response.error
//                           : JSON.stringify(response.error, null, 2)}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {!response && !loading && (
//                 <div className="text-center py-16">
//                   <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <Zap className="w-8 h-8 text-primary" />
//                   </div>
//                   <h3 className="text-lg font-medium text-card-foreground mb-2">
//                     Ready to test your API
//                   </h3>
//                   <p className="text-muted-foreground">
//                     Configure your request and hit execute to see the response
//                     here
//                   </p>
//                 </div>
//               )}
//             </div>

//             {/* Quick Stats */}
//             {history.length > 0 && (
//               <div className="bg-card rounded-xl shadow-sm border p-6">
//                 <h3 className="text-lg font-semibold text-card-foreground mb-4">
//                   Quick Stats
//                 </h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="text-center p-4 bg-success/10 rounded-lg">
//                     <div className="text-2xl font-bold text-success">
//                       {history.filter((h) => h.response.success).length}
//                     </div>
//                     <div className="text-sm text-success">Successful</div>
//                   </div>
//                   <div className="text-center p-4 bg-destructive/10 rounded-lg">
//                     <div className="text-2xl font-bold text-destructive">
//                       {history.filter((h) => !h.response.success).length}
//                     </div>
//                     <div className="text-sm text-destructive">Failed</div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Tips */}
//             <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6">
//               <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center space-x-2">
//                 <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
//                   <span className="text-primary text-sm">💡</span>
//                 </div>
//                 <span>Pro Tips</span>
//               </h3>
//               <ul className="space-y-2 text-sm text-muted-foreground">
//                 <li className="flex items-start space-x-2">
//                   <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
//                   <span>
//                     Use the history tab to quickly replay previous requests
//                   </span>
//                 </li>
//                 <li className="flex items-start space-x-2">
//                   <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
//                   <span>Save frequently used API keys for faster testing</span>
//                 </li>
//                 <li className="flex items-start space-x-2">
//                   <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
//                   <span>
//                     Check the docs tab for available endpoint reference
//                   </span>
//                 </li>
//                 <li className="flex items-start space-x-2">
//                   <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
//                   <span>
//                     Copy response data using the copy button for further
//                     analysis
//                   </span>
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
