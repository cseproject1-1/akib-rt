"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Button, cn } from "@/components/ui/Button";
import { TemplateCard } from "@/components/marketplace/TemplateCard";
import { TemplatePreviewModal } from "@/components/marketplace/TemplatePreviewModal";
import { MARKETPLACE_TEMPLATES, CATEGORIES, MarketplaceTemplate } from "@/data/marketplaceTemplates";
import { Search, ShoppingBag, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<MarketplaceTemplate | null>(null);

  const filteredTemplates = MARKETPLACE_TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredTemplates = filteredTemplates.filter((t) => t.featured);
  const regularTemplates = filteredTemplates.filter((t) => !t.featured);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 pt-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="h-8 w-8 text-purple-400" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Marketplace</h2>
          </div>
          <p className="text-muted-foreground">
            Discover and apply pre-built routine templates to jumpstart your productivity
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="h-12 bg-muted border-border"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                  selectedCategory === category
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-border bg-muted/30">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
              <Search className="h-10 w-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Templates Found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Try adjusting your search or filter to find what you&apos;re looking for.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Templates */}
            {featuredTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    Featured Templates
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onPreview={setPreviewTemplate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Templates */}
            {regularTemplates.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  All Templates ({regularTemplates.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onPreview={setPreviewTemplate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <TemplatePreviewModal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        template={previewTemplate}
      />
    </div>
  );
}
