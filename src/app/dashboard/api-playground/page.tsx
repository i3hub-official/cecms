"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  isActive: boolean;
}

export default function ApiPlaygroundPage() {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [endpoint, setEndpoint] = useState('/apis/v1/center-lookup?number=');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchApiKeys();
    loadHistory();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/apis/v1/user/api-keys', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const loadHistory = () => {
    const savedHistory = localStorage.getItem('apiPlaygroundHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  };

  const saveToHistory = (request: any, response: any) => {
    const newHistory = [
      { timestamp: new Date().toISOString(), request, response },
      ...history.slice(0, 9) // Keep only last 10 items
    ];
    setHistory(newHistory);
    localStorage.setItem('apiPlaygroundHistory', JSON.stringify(newHistory));
  };

  const executeRequest = async () => {
    setLoading(true);
    setResponse(null);
    setResponseTime(0);

    const startTime = performance.now();
    const apiKey = selectedApiKey || apiKeyInput;

    if (!apiKey) {
      setResponse({
        success: false,
        error: 'API key is required'
      });
      setLoading(false);
      return;
    }

    try {
      const url = `https://192.168.0.159:3002${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      };

      if (method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const response = await fetch(url, options);
      const data = await response.json();
      const endTime = performance.now();

      setResponse(data);
      setResponseTime(endTime - startTime);

      // Save to history
      saveToHistory({
        url,
        method,
        headers: options.headers,
        body: requestBody,
      }, data);

    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const presetEndpoints = [
    { value: '/apis/v1/center-lookup?number=', label: 'Center Lookup' },
    { value: '/apis/v1/dispute-center/', label: 'Get Dispute Center' },
    { value: '/apis/v1/dispute-center', label: 'List Dispute Centers' },
    { value: '/apis/v1/helper/', label: 'Helper Endpoint' },
  ];

  const presetBodies = {
    'POST /dispute-center': JSON.stringify({
      name: "New Dispute Center",
      address: "123 Main Street",
      state: "Lagos",
      lga: "Ikeja",
      email: "center@example.com",
      phone: "+2348000000000"
    }, null, 2),
    'PUT /dispute-center': JSON.stringify({
      name: "Updated Center Name",
      address: "456 Updated Street"
    }, null, 2)
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">API Playground</h1>
        <button
          onClick={fetchApiKeys}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Refresh API Keys
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Request */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Request Configuration</h2>

            {/* API Key Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">API Key</label>
              <select
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select API Key</option>
                {apiKeys.filter(key => key.isActive).map((key) => (
                  <option key={key.id} value={key.prefix + '...'}>
                    {key.name} ({key.prefix}...)
                  </option>
                ))}
              </select>
              <div className="text-center text-gray-500">OR</div>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter full API key"
                className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            {/* HTTP Method */}
            <div className="mt-4">
              <label className="block text-sm font-medium">HTTP Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
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
              <label className="block text-sm font-medium">Endpoint</label>
              <div className="flex space-x-2">
                <select
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                >
                  {presetEndpoints.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setEndpoint('')}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="Enter endpoint (e.g., /apis/v1/center-lookup?number=123)"
                className="w-full mt-2 p-2 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            {/* Request Body */}
            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Request Body</label>
                  <select
                    onChange={(e) => setRequestBody(presetBodies[e.target.value as keyof typeof presetBodies] || '')}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Preset bodies</option>
                    <option value="POST /dispute-center">POST /dispute-center</option>
                    <option value="PUT /dispute-center">PUT /dispute-center</option>
                  </select>
                </div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="Enter JSON request body"
                  rows={8}
                  className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                />
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={executeRequest}
              disabled={loading}
              className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Request...' : 'Execute Request'}
            </button>
          </div>

          {/* Request History */}
          {history.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setEndpoint(item.request.url.replace('https://192.168.0.159:3002', ''));
                      setMethod(item.request.method);
                      setRequestBody(item.request.body || '');
                      setResponse(item.response);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.response.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.request.method}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm font-mono mt-1 truncate">
                      {item.request.url.replace('https://192.168.0.159:3002', '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Response */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Response</h2>
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {response && !loading && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    response.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {response.success ? 'Success' : 'Error'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {responseTime.toFixed(0)} ms
                  </span>
                </div>

                {response.metadata?.rateLimit && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-800">
                      Rate Limit: {response.metadata.rateLimit.remaining} / {response.metadata.rateLimit.limit} remaining
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-md p-4">
                  <pre className="text-sm overflow-auto max-h-96">
                    {formatJson(response)}
                  </pre>
                </div>

                {response.error && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md">
                    <h4 className="font-medium text-red-800">Error:</h4>
                    <p className="text-red-600">{response.error}</p>
                  </div>
                )}
              </div>
            )}

            {!response && !loading && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">⚡</div>
                <p>Execute a request to see the response here</p>
              </div>
            )}
          </div>

          {/* API Documentation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Available Endpoints</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">GET</span>
                  <code className="text-sm font-mono">/apis/v1/center-lookup?number=:number</code>
                </div>
                <p className="text-sm text-gray-600 ml-10">Lookup center by number</p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">GET</span>
                  <code className="text-sm font-mono">/apis/v1/dispute-center/:id</code>
                </div>
                <p className="text-sm text-gray-600 ml-10">Get dispute center by ID</p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">POST</span>
                  <code className="text-sm font-mono">/apis/v1/dispute-center</code>
                </div>
                <p className="text-sm text-gray-600 ml-10">Create new dispute center</p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">PUT</span>
                  <code className="text-sm font-mono">/apis/v1/dispute-center/:id</code>
                </div>
                <p className="text-sm text-gray-600 ml-10">Update dispute center</p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">DELETE</span>
                  <code className="text-sm font-mono">/apis/v1/dispute-center/:id</code>
                </div>
                <p className="text-sm text-gray-600 ml-10">Delete dispute center</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}