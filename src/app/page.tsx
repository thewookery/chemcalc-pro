"use client";

import React, { useState, useMemo, useEffect } from 'react';
import CalculatorCard from '@/components/CalculatorCard';
import { CALCULATORS, CATEGORIES, type Category } from '@/lib/calculators';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Star, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem('chemcalc_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // ignore local storage errors
    }
  }, []);

  const toggleFavorite = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem('chemcalc_favorites', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const filteredCalculators = useMemo(() => {
    return CALCULATORS.filter((calc) => {
      const matchesCategory = selectedCategory === 'All' || calc.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        calc.name.toLowerCase().includes(query) ||
        calc.description.toLowerCase().includes(query) ||
        calc.category.toLowerCase().includes(query) ||
        (calc.formulaBadge && calc.formulaBadge.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const favoriteCalculators = useMemo(() => {
    if (!isClient || favorites.length === 0) return [];
    return CALCULATORS.filter((calc) => favorites.includes(calc.slug));
  }, [isClient, favorites]);

  return (
    <>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="animated-background-effect" />
      </div>

      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Z & S Quality Control Lab Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl font-headline">
            Laboratory & Batch Calculations
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground text-sm sm:text-base md:text-lg">
            Rapid analytical titrations, batch adjustments, and trial formulation tools designed for everyday plant & laboratory QC.
          </p>
        </section>

        {/* Search & Category Filter Controls */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by calculator name, formula, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-11 bg-card/60 backdrop-blur border-border shadow-sm text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Total Count Badge */}
            <div className="text-xs text-muted-foreground whitespace-nowrap self-end sm:self-center font-medium px-2 py-1 bg-muted rounded-md border">
              Showing {filteredCalculators.length} of {CALCULATORS.length} tools
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Pinned / Favorites Section (if any and not searching) */}
        {favoriteCalculators.length > 0 && !searchQuery && selectedCategory === 'All' && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Pinned Tools (Favorites)</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favoriteCalculators.map((calc) => (
                <CalculatorCard
                  key={`fav-${calc.slug}`}
                  calculator={calc}
                  isFavorite={true}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
            <div className="border-b pt-4" />
          </section>
        )}

        {/* Main Grid */}
        <section>
          {filteredCalculators.length === 0 ? (
            <div className="text-center py-16 space-y-3 border rounded-xl bg-card/40 border-dashed">
              <p className="text-base font-medium text-foreground">No calculators match your search.</p>
              <p className="text-sm text-muted-foreground">Try searching for a different keyword or select "All" categories.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCalculators.map((calc) => (
                <CalculatorCard
                  key={calc.slug}
                  calculator={calc}
                  isFavorite={favorites.includes(calc.slug)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
