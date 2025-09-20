// src/app/components/centers/CentersTable.tsx
import { useState } from "react";
import {
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  MapPin,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Center } from "@/types/center";

interface CentersTableProps {
  centers: Center[];
  loading: boolean;
  onEdit: (center: Center) => void;
  onDelete: (center: Center) => void;
  onAdd: () => void;
  searchTerm: string;
}

export default function CentersTable({
  centers,
  loading,
  onEdit,
  onDelete,
  onAdd,
  searchTerm,
}: CentersTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatShortDate = (date: string) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-background rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredCenters = centers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
      {/* Mobile Cards */}
      <div className="space-y-3 p-4 md:hidden">
        {filteredCenters.length > 0 ? (
          filteredCenters.map((center) => {
            const isExpanded = expandedId === center.id;

            return (
              <div
                key={center.id}
                className="bg-background rounded-lg shadow-sm border border-border transition hover:shadow-md"
              >
                {/* Card Header - Always visible */}
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {center.name}
                        </h3>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          #{center.number}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{center.address}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {center.isActive ? (
                            <span className="inline-flex items-center text-green-600 gap-1 text-xs font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600 gap-1 text-xs font-medium">
                              <AlertCircle className="w-3.5 h-3.5" /> Inactive
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Updated: {formatShortDate(center.modifiedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : center.id)
                      }
                      className="ml-2 p-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Slide Down Actions */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-3 flex justify-end gap-2 bg-muted/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(center);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(center);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
            <p>No centers found</p>
            <p className="text-sm mt-1">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                {[
                  "Center Details",
                  "Location",
                  "Status",
                  "Last Modified",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCenters.map((center) => (
                <tr
                  key={center.id}
                  className="hover:bg-muted/10 transition-colors"
                >
                  {/* Details */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {center.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      #{center.number}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-foreground/80 max-w-xs">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{center.address}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {center.isActive ? (
                      <span className="inline-flex items-center text-green-600 gap-1 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-600 gap-1 text-sm font-medium">
                        <AlertCircle className="w-4 h-4" /> Inactive
                      </span>
                    )}
                  </td>

                  {/* Last Modified */}
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatShortDate(center.modifiedAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(center)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                        aria-label="Edit center"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(center)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                        aria-label="Delete center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCenters.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p>No centers found</p>
                    <p className="text-sm mt-1">
                      Try adjusting your search terms
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
