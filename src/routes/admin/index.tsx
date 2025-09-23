import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AdminAuth } from "~/components/admin/admin-auth";

export default component$(() => {
  return (
    <div class="admin-page">
      <AdminAuth />
    </div>
  );
});

export const head: DocumentHead = {
  title: "Admin Login - Your Self-Hosted App",
  meta: [
    {
      name: "description",
      content: "Admin login for self-hosted application",
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
};
