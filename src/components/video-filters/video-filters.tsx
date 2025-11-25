import { component$, useStylesScoped$, type QRL } from "@builder.io/qwik";
import styles from "./video-filters.css?inline";

export type SortOption = "newest" | "oldest" | "title" | "duration";

interface VideoFiltersProps {
  currentSort?: SortOption;
  onSortChange$: QRL<(value: string) => void>;
  onResetFilters$?: QRL<() => void>;
}

export const VideoFilters = component$<VideoFiltersProps>(
  ({ currentSort = "newest", onSortChange$, onResetFilters$ }) => {
    useStylesScoped$(styles);

    return (
      <aside
        class="video-filters"
        role="complementary"
        aria-label="Video filters"
      >
        <div class="filters-header">
          <h3 class="filters-title">
            <span class="filters-icon" aria-hidden="true">
              🎛️
            </span>
            Filters
          </h3>
          {onResetFilters$ && (
            <button
              onClick$={onResetFilters$}
              class="btn-reset"
              aria-label="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>

        <div class="filter-group">
          <label for="sort-select" class="filter-label">
            Sort By
          </label>
          <select
            id="sort-select"
            class="filter-select"
            value={currentSort}
            onChange$={(e) =>
              onSortChange$((e.target as HTMLSelectElement).value)
            }
            aria-label="Sort videos by"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A-Z)</option>
            <option value="duration">Duration (Longest)</option>
          </select>
        </div>

        <div class="filter-info">
          <p class="info-text">
            <span aria-hidden="true">ℹ️</span>
            Use filters to organize and find videos more easily
          </p>
        </div>

        <div class="filter-tips">
          <h4 class="tips-title">Quick Tips</h4>
          <ul class="tips-list">
            <li>🔍 Use search to find specific videos</li>
            <li>📅 Sort by date to see latest uploads</li>
            <li>🏷️ Sort alphabetically for easy browsing</li>
            <li>⏱️ Sort by duration to find long/short content</li>
          </ul>
        </div>
      </aside>
    );
  }
);
