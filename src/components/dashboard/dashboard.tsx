import { component$ } from "@builder.io/qwik";

export const Dashboard = component$(() => {
  return (
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to your self-hosted application!</p>
      </header>

      <main class="dashboard-content">
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <h3>Quick Stats</h3>
            <p>Your application is running successfully.</p>
          </div>

          <div class="dashboard-card">
            <h3>System Info</h3>
            <p>Client-side authentication enabled</p>
            <p>Data stored locally in browser</p>
          </div>

          <div class="dashboard-card">
            <h3>Getting Started</h3>
            <p>
              This is your secure self-hosted page. You can now customize it
              according to your needs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
});
