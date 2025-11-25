import {
  component$,
  useSignal,
  useStylesScoped$,
  $,
  useVisibleTask$,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { LuSearch, LuX } from "@qwikest/icons/lucide";
import styles from "./search-bar.css?inline";

interface SearchBarProps {
  placeholder?: string;
  variant?: "header" | "page";
}

export const SearchBar = component$<SearchBarProps>(
  ({ placeholder = "Search videos...", variant = "header" }) => {
    useStylesScoped$(styles);
    const navigate = useNavigate();
    const searchQuery = useSignal("");
    const isFocused = useSignal(false);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
      // Load search query from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get("q");
      if (query) {
        searchQuery.value = query;
      }
    });

    const handleSearch = $(async (e: Event) => {
      e.preventDefault();
      const query = searchQuery.value.trim();

      if (query) {
        // Navigate to videos page with search query
        await navigate(`/videos?q=${encodeURIComponent(query)}`);
      } else {
        // If empty, just go to videos page
        await navigate("/videos");
      }
    });

    const handleClear = $(() => {
      searchQuery.value = "";
    });

    return (
      <form
        class={`search-bar ${variant === "page" ? "search-bar-page" : ""} ${
          isFocused.value ? "focused" : ""
        }`}
        onSubmit$={handleSearch}
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
            onInput$={(e) =>
              (searchQuery.value = (e.target as HTMLInputElement).value)
            }
            onFocus$={() => (isFocused.value = true)}
            onBlur$={() => (isFocused.value = false)}
            aria-label="Search videos"
          />
          {searchQuery.value && (
            <button
              type="button"
              class="clear-button"
              onClick$={handleClear}
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
    );
  }
);
