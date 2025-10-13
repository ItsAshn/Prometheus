import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { Auth } from "../auth/auth";
import VideoList from "../video/VideoList";

interface AppState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const App = component$(() => {
  const appState = useStore<AppState>({
    isAuthenticated: false,
    isLoading: true,
  });

  // Check authentication status on app load
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const checkAuth = () => {
      // Check if user has completed the auth process
      const storedCredentials = localStorage.getItem("app-credentials");
      const authSession = sessionStorage.getItem("auth-session");

      if (storedCredentials && authSession) {
        appState.isAuthenticated = true;
      }
      appState.isLoading = false;
    };

    checkAuth();

    // Listen for auth changes from the Auth component
    const handleAuthChange = (event: CustomEvent) => {
      appState.isAuthenticated = event.detail.isAuthenticated;
      if (event.detail.isAuthenticated) {
        sessionStorage.setItem("auth-session", "true");
      } else {
        sessionStorage.removeItem("auth-session");
      }
    };

    window.addEventListener("auth-changed", handleAuthChange as EventListener);

    return () => {
      window.removeEventListener(
        "auth-changed",
        handleAuthChange as EventListener
      );
    };
  });

  if (appState.isLoading) {
    return (
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div class="app">
      {appState.isAuthenticated ? <VideoList isAdmin={true} /> : <Auth />}
    </div>
  );
});
