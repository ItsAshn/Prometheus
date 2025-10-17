import {
  component$,
  useStylesScoped$,
  useResource$,
  Resource,
} from "@builder.io/qwik";
import { loadVersionServer } from "~/lib/data-loaders";
import styles from "./footer.css?inline";

export const Footer = component$(() => {
  useStylesScoped$(styles);

  const versionResource = useResource$<{ version: string }>(async () => {
    try {
      const data = await loadVersionServer();
      return { version: data?.version || "v1.0.0" };
    } catch {
      return { version: "v1.0.0" };
    }
  });
  return (
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-section">
            <h3 class="footer-title">Prometheus</h3>
            <p class="footer-description">
              Your premier destination for high-quality video streaming and
              content management.
            </p>
          </div>

          <div class="footer-section">
            <h4 class="footer-heading">Platform</h4>
            <ul class="footer-links">
              <li>
                <a href="/videos" class="footer-link">
                  Browse Videos
                </a>
              </li>
              <li>
                <a href="/dashboard" class="footer-link">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/admin" class="footer-link">
                  Admin Panel
                </a>
              </li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-heading">Support</h4>
            <ul class="footer-links">
              <li>
                <a href="#" class="footer-link">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" class="footer-link">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" class="footer-link">
                  Status
                </a>
              </li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-heading">Legal</h4>
            <ul class="footer-links">
              <li>
                <a href="#" class="footer-link">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" class="footer-link">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" class="footer-link">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <p class="footer-copyright">
              © {new Date().getFullYear()} Prometheus. All rights reserved.
            </p>
            <div class="footer-social">
              <Resource
                value={versionResource}
                onPending={() => <span class="footer-version">Loading...</span>}
                onRejected={() => <span class="footer-version">v1.0.0</span>}
                onResolved={(data) => (
                  <span class="footer-version">{data.version}</span>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});
