import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { LuMonitor, LuBan, LuLock, LuZap } from "@qwikest/icons/lucide";
import styles from "./footer.css?inline";

interface FooterProps {
  channelName?: string;
}

export const Footer = component$<FooterProps>(
  ({ channelName = "Video Platform" }) => {
    useStylesScoped$(styles);

    const currentYear = new Date().getFullYear();

    return (
      <footer class="site-footer" role="contentinfo">
        <div class="footer-content">
          <div class="footer-grid">
            {/* About Section */}
            <div class="footer-section">
              <h3 class="footer-title">
                <span class="footer-icon" aria-hidden="true">
                  <LuMonitor />
                </span>
                {channelName}
              </h3>
              <p class="footer-description">
                Self-hosted video streaming platform. Enjoy ad-free content with
                complete privacy and control.
              </p>
            </div>

            {/* Quick Links */}
            <nav class="footer-section" aria-label="Footer navigation">
              <h4 class="footer-heading">Quick Links</h4>
              <div class="footer-links">
                <a href="/" class="footer-link">
                  Home
                </a>
                <a href="/videos" class="footer-link">
                  Videos
                </a>
                <a href="/about" class="footer-link">
                  About
                </a>
                <a href="/admin" class="footer-link">
                  Admin
                </a>
              </div>
            </nav>

            {/* Platform Info */}
            <div class="footer-section">
              <h4 class="footer-heading">Platform</h4>
              <nav class="footer-links" aria-label="Platform information">
                <a
                  href="/api/health"
                  class="footer-link"
                  aria-label="Check system status"
                >
                  System Status
                </a>
                <a
                  href="/api/version"
                  class="footer-link"
                  aria-label="View version information"
                >
                  Version Info
                </a>
              </nav>
              <div
                class="footer-badges"
                role="list"
                aria-label="Platform features"
              >
                <span
                  class="badge"
                  role="listitem"
                  aria-label="Ad-free platform"
                >
                  <LuBan /> Ad-Free
                </span>
                <span
                  class="badge"
                  role="listitem"
                  aria-label="Private and secure"
                >
                  <LuLock /> Private
                </span>
                <span class="badge" role="listitem" aria-label="Fast streaming">
                  <LuZap /> Fast
                </span>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div class="footer-bottom">
            <div class="footer-copyright">
              <p>
                © {currentYear} {channelName}. All rights reserved.
              </p>
              <p class="footer-powered">
                Powered by{" "}
                <a
                  href="https://qwik.builder.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="footer-tech-link"
                  aria-label="Qwik framework (opens in new tab)"
                >
                  Qwik
                </a>{" "}
                &{" "}
                <a
                  href="https://ffmpeg.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="footer-tech-link"
                  aria-label="FFmpeg video processing (opens in new tab)"
                >
                  FFmpeg
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }
);
