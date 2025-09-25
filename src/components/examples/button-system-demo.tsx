import { component$ } from "@builder.io/qwik";

/**
 * Button System Demo Component
 *
 * This component demonstrates all the standardized button variants and sizes
 * available in the new button system. Use this as a reference for implementing
 * buttons throughout the application.
 */
export const ButtonSystemDemo = component$(() => {
  return (
    <div class="p-8 space-y-8">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Standardized Button System</h2>
          <p class="card-description">
            All button variants and sizes available in the application
          </p>
        </div>

        <div class="card-content space-y-6">
          {/* Button Variants */}
          <section>
            <h3 class="text-lg font-semibold mb-4">Button Variants</h3>
            <div class="flex flex-wrap gap-3">
              <button class="btn btn-primary">Primary</button>
              <button class="btn btn-secondary">Secondary</button>
              <button class="btn btn-destructive">Destructive</button>
              <button class="btn btn-success">Success</button>
              <button class="btn btn-warning">Warning</button>
              <button class="btn btn-ghost">Ghost</button>
              <button class="btn btn-outline">Outline</button>
            </div>
          </section>

          {/* Button Sizes */}
          <section>
            <h3 class="text-lg font-semibold mb-4">Button Sizes</h3>
            <div class="flex flex-wrap items-center gap-3">
              <button class="btn btn-primary btn-sm">Small</button>
              <button class="btn btn-primary btn-md">Medium</button>
              <button class="btn btn-primary btn-lg">Large</button>
            </div>
          </section>

          {/* Full Width Button */}
          <section>
            <h3 class="text-lg font-semibold mb-4">Full Width</h3>
            <button class="btn btn-primary btn-full">Full Width Button</button>
          </section>

          {/* Disabled States */}
          <section>
            <h3 class="text-lg font-semibold mb-4">Disabled States</h3>
            <div class="flex flex-wrap gap-3">
              <button class="btn btn-primary" disabled>
                Disabled Primary
              </button>
              <button class="btn btn-secondary" disabled>
                Disabled Secondary
              </button>
              <button class="btn btn-destructive" disabled>
                Disabled Destructive
              </button>
            </div>
          </section>

          {/* Legacy Button Examples (for comparison) */}
          <section>
            <h3 class="text-lg font-semibold mb-4">
              Legacy Buttons (Maintained for Compatibility)
            </h3>
            <div class="flex flex-wrap gap-3">
              <button class="submit-btn">Submit Button</button>
              <button class="upload-btn">Upload Button</button>
              <button class="delete-btn">Delete Button</button>
              <button class="logout-btn">Logout Button</button>
              <button class="retry-btn">Retry Button</button>
            </div>
          </section>

          {/* Form Example */}
          <section>
            <h3 class="text-lg font-semibold mb-4">Form Actions Example</h3>
            <form class="space-y-4" preventdefault:submit>
              <div class="form-group">
                <label for="demo-input">Example Input</label>
                <input
                  id="demo-input"
                  class="input"
                  placeholder="Enter some text..."
                />
              </div>
              <div class="flex gap-3">
                <button type="submit" class="btn btn-primary">
                  Save Changes
                </button>
                <button type="button" class="btn btn-secondary">
                  Cancel
                </button>
                <button type="reset" class="btn btn-destructive btn-sm">
                  Reset
                </button>
              </div>
            </form>
          </section>

          {/* Card Actions Example */}
          <section>
            <h3 class="text-lg font-semibold mb-4">Card Actions Example</h3>
            <div class="card border">
              <div class="card-header">
                <h4 class="card-title">Sample Card</h4>
                <p class="card-description">
                  This card demonstrates button usage in context
                </p>
              </div>
              <div class="card-content">
                <p>Card content goes here...</p>
              </div>
              <div class="card-footer flex gap-2">
                <button class="btn btn-primary btn-sm">Edit</button>
                <button class="btn btn-outline btn-sm">View</button>
                <button class="btn btn-destructive btn-sm">Delete</button>
              </div>
            </div>
          </section>

          {/* Navigation Example */}
          <section>
            <h3 class="text-lg font-semibold mb-4">Navigation Example</h3>
            <nav class="flex gap-2 p-4 bg-card border rounded-lg">
              <a href="#" class="btn btn-ghost">
                Home
              </a>
              <a href="#" class="btn btn-ghost">
                About
              </a>
              <a href="#" class="btn btn-ghost">
                Contact
              </a>
              <div class="ml-auto">
                <button class="btn btn-primary btn-sm">Login</button>
              </div>
            </nav>
          </section>
        </div>
      </div>
    </div>
  );
});
