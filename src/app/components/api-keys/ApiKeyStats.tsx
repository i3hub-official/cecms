// src/app/components/api-keys/ApiKeyStats.tsx
import { ApiKey } from "@/types/api-keys";

interface ApiKeyStatsProps {
  apiKeys: ApiKey[];
}

export default function ApiKeyStats({ apiKeys }: ApiKeyStatsProps) {
  const isExpired = (dateString: string) => {
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(
      (key) => !key.revokedAt && key.isActive && !isExpired(key.expiresAt)
    ).length,
    expired: apiKeys.filter((key) => isExpired(key.expiresAt) && !key.revokedAt)
      .length,
    revoked: apiKeys.filter((key) => key.revokedAt).length,
  };

  const statCards = [
    {
      title: "Total Keys",
      value: stats.total,
      color: "text-foreground",
    },
    {
      title: "Active Keys",
      value: stats.active,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Expired Keys",
      value: stats.expired,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Revoked Keys",
      value: stats.revoked,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-card rounded-xl shadow-sm p-6 border border-border"
        >
          <div className="text-sm font-medium text-muted-foreground">
            {stat.title}
          </div>
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
