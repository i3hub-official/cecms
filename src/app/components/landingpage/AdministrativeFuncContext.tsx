"use client";
import { adminFeatures } from "./FeaturesContext";
import { ChevronRight, CheckCircle } from "lucide-react";

const AdministrativeFuncContext = () => {
  return (
    <div className="lg:col-span-2">
      <div className="bg-background text-foreground rounded-2xl shadow-sm border border-border p-6 transition-colors duration-300">
        <h2 className="text-xl font-bold mb-6">Administrative Functions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminFeatures.map((feature, index) => (
            <div
              key={index}
              className="border border-border rounded-xl p-6 hover:shadow-md transition-all hover:border-primary"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                  <feature.icon className="h-6 w-6" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>

              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {feature.description}
              </p>

              <div className="space-y-1">
                {feature.actions.slice(0, 2).map((action, actionIndex) => (
                  <div
                    key={actionIndex}
                    className="flex items-center space-x-2 text-xs text-muted-foreground"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdministrativeFuncContext;
