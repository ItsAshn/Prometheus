import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { LuChevronRight, LuHome } from "@qwikest/icons/lucide";
import styles from "./breadcrumb.css?inline";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export const Breadcrumb = component$<BreadcrumbProps>(
  ({ items, showHome = true }) => {
    useStylesScoped$(styles);

    return (
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
          {showHome && (
            <li class="breadcrumb-item">
              <a href="/" class="breadcrumb-link">
                <LuHome />
                <span class="breadcrumb-label">Home</span>
              </a>
              {items.length > 0 && (
                <span class="breadcrumb-separator" aria-hidden="true">
                  <LuChevronRight />
                </span>
              )}
            </li>
          )}

          {items.map((item, index) => (
            <li key={index} class="breadcrumb-item">
              {item.href && index < items.length - 1 ? (
                <>
                  <a href={item.href} class="breadcrumb-link">
                    <span class="breadcrumb-label">{item.label}</span>
                  </a>
                  <span class="breadcrumb-separator" aria-hidden="true">
                    <LuChevronRight />
                  </span>
                </>
              ) : (
                <span class="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  },
);
