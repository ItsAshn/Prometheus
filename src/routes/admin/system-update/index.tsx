import { component$ } from "@builder.io/qwik";
import { SystemUpdateManager } from "~/components/admin/system-update-manager";

export default component$(() => {
  return (
    <div class="admin-page">
      <SystemUpdateManager />
    </div>
  );
});
