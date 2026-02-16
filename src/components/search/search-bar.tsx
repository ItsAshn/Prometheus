import {
  component$,
  useSignal,
  useStylesScoped$,
  $,
  useVisibleTask$,
  useStore,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { LuSearch, LuX, LuClock } from "@qwikest/icons/lucide";
import styles from "./search-bar.css?inline";

interface SearchBarProps {
  placeholder?: string;
  variant?: "header" | "page";
}

interface SearchSuggestion {
  type: "video" | "recent";
  text: string;
  id?: string;
}

export const SearchBar = component$<SearchBarProps>(
  ({ placeholder = "Search videos...", variant = "header" }) => {
    useStylesScoped$(styles);
    const navigate = useNavigate();
    const searchQuery = useSignal("");
    const isFocused = useSignal(false);
    const showSuggestions = useSignal(false);
    const suggestions = useStore<SearchSuggestion[]>([]);
    const selectedIndex = useSignal(-1);
    const debounceTimer = useSignal<number>(0);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
      // Load search query from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get("q");
      if (query) {
        searchQuery.value = query;
      }
    });

    const getRecentSearches = $(() => {
      if (typeof window === "undefined") return [];
      const stored = localStorage.getItem("recentSearches");
      if (!stored) return [];
      try {
        return JSON.parse(stored) as string[];
      } catch {
        return [];
      }
    });

    const saveRecentSearch = $((query: string) => {
      if (typeof window === "undefined") return;
      const recent = JSON.parse(
        localStorage.getItem("recentSearches") || "[]",
      ) as string[];
      const updated = [query, ...recent.filter((q) => q !== query)].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    });

    const fetchSuggestions = $(async (query: string) => {
      if (!query.trim()) {
        const recent = await getRecentSearches();
        suggestions.splice(
          0,
          suggestions.length,
          ...recent.map((text) => ({ type: "recent" as const, text })),
        );
        return;
      }

      try {
        const response = await fetch(
          `/api/videos/search-suggestions?q=${encodeURIComponent(query)}`,
        );
        if (response.ok) {
          const data = await response.json();
          const videoSuggestions: SearchSuggestion[] =
            data.suggestions?.map((video: any) => ({
              type: "video" as const,
              text: video.title,
              id: video.id,
            })) || [];

          suggestions.splice(0, suggestions.length, ...videoSuggestions);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    });

    const handleInput$ = $(async (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      searchQuery.value = value;
      selectedIndex.value = -1;

      clearTimeout(debounceTimer.value);
      debounceTimer.value = setTimeout(async () => {
        await fetchSuggestions(value);
        showSuggestions.value = true;
      }, 300) as any;
    });

    const handleSearch = $(async (query?: string) => {
      const searchValue = query || searchQuery.value.trim();

      if (searchValue) {
        await saveRecentSearch(searchValue);
        await navigate(`/videos?q=${encodeURIComponent(searchValue)}`);
      } else {
        await navigate("/videos");
      }

      showSuggestions.value = false;
      if (typeof window !== "undefined") {
        (document.activeElement as HTMLElement)?.blur();
      }
    });

    const handleSubmit$ = $(async (e: Event) => {
      e.preventDefault();

      const selectedSuggestion = suggestions[selectedIndex.value];
      if (selectedIndex.value >= 0 && selectedSuggestion) {
        await handleSearch(selectedSuggestion.text);
      } else {
        await handleSearch();
      }
    });

    const handleClear$ = $(() => {
      searchQuery.value = "";
      suggestions.splice(0, suggestions.length);
      showSuggestions.value = false;
      selectedIndex.value = -1;
    });

    const handleFocus$ = $(async () => {
      isFocused.value = true;
      if (!searchQuery.value.trim()) {
        await fetchSuggestions("");
      }
      showSuggestions.value = true;
    });

    const handleBlur$ = $(() => {
      isFocused.value = false;
      // Delay to allow click on suggestion
      setTimeout(() => {
        showSuggestions.value = false;
      }, 200);
    });

    const handleKeyDown$ = $((e: KeyboardEvent) => {
      if (!showSuggestions.value || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex.value = Math.min(
          selectedIndex.value + 1,
          suggestions.length - 1,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      } else if (e.key === "Escape") {
        showSuggestions.value = false;
        selectedIndex.value = -1;
      }
    });

    const handleSuggestionClick$ = $(async (suggestion: SearchSuggestion) => {
      searchQuery.value = suggestion.text;
      await handleSearch(suggestion.text);
    });

    return (
      <div class="search-container">
        <form
          class={`search-bar ${variant === "page" ? "search-bar-page" : ""} ${
            isFocused.value ? "focused" : ""
          }`}
          onSubmit$={handleSubmit$}
        >
          <div class="search-input-wrapper">
            <span class="search-icon">
              <LuSearch />
            </span>
            <input
              type="text"
              class="search-input"
              placeholder={placeholder}
              value={searchQuery.value}
              onInput$={handleInput$}
              onFocus$={handleFocus$}
              onBlur$={handleBlur$}
              onKeyDown$={handleKeyDown$}
              aria-label="Search videos"
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-expanded={showSuggestions.value && suggestions.length > 0}
              autoComplete="off"
            />
            {searchQuery.value && (
              <button
                type="button"
                class="clear-button"
                onClick$={handleClear$}
                aria-label="Clear search"
              >
                <LuX />
              </button>
            )}
            <button type="submit" class="search-button" aria-label="Search">
              Search
            </button>
          </div>
        </form>

        {showSuggestions.value && suggestions.length > 0 && (
          <div
            id="search-suggestions"
            class={`suggestions-dropdown ${variant === "page" ? "suggestions-page" : ""}`}
            role="listbox"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${index}`}
                type="button"
                class={`suggestion-item ${selectedIndex.value === index ? "selected" : ""}`}
                onClick$={() => handleSuggestionClick$(suggestion)}
                role="option"
                aria-selected={selectedIndex.value === index}
              >
                <span class="suggestion-icon">
                  {suggestion.type === "recent" ? <LuClock /> : <LuSearch />}
                </span>
                <span class="suggestion-text">{suggestion.text}</span>
                {suggestion.type === "recent" && (
                  <span class="suggestion-badge">Recent</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);
