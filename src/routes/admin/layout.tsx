import { component$, Slot } from "@builder.io/qwik";

export const Layout = component$(() => {
  return (
    <div>
      <Slot />
    </div>
  );
});
