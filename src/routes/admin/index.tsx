import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import AdminAuth from "~/components/admin/AdminAuth";

export default component$(() => {
  return (
    <div class="admin-page">
      <AdminAuth />
    </div>
  );
});

export const head: DocumentHead = {
  title: "Admin Login - Video Platform",
  meta: [
    {
      name: "description",
      content: "Admin login for self-hosted video platform",
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
};
