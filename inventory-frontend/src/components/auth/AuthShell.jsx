import { Link } from "react-router-dom";
import Aurora from "../effects/Aurora/Aurora";
import "./AuthShell.css";

function AuthShell({
  mode = "login",
  title,
  subtitle,
  children,
}) {
  const isLogin = mode === "login";

  return (
    <div className={`auth-page ${isLogin ? "auth-page--login" : "auth-page--register"}`}>
      <div className="auth-background" aria-hidden="true">
        <Aurora />
      </div>

      <div className="auth-background-overlay" aria-hidden="true" />

      <header className="auth-navbar">
        <div className="auth-navbar__inner">
        <Link to="/" className="navbar-brand">
          <span>INVENTORY</span>
        </Link>

          <Link to="/" className="auth-navbar__back">
            <span>Back to main page</span>
            <span className="auth-navbar__arrow" aria-hidden="true">
              ←
            </span>
          </Link>
        </div>
      </header>

      <main className="auth-main">
        <section className="auth-card">
          <div className="auth-content">
            <div className="auth-info">
              <div className="auth-info__line" />

              <span className="auth-eyebrow">
                {isLogin ? "Inventory workspace" : "Get started"}
              </span>

              <h2 className="auth-info__title">
                {isLogin
                  ? "Everything your operation needs, in one place."
                  : "Build a clearer inventory workflow from day one."}
              </h2>

              <p className="auth-info__description">
                {isLogin
                  ? "Manage stock, warehouses, products and daily operations from one organized workspace."
                  : "Create your account and get ready to manage products, stock, warehouses and operations with your team."}
              </p>

              <div className="auth-info__points">
                {isLogin ? (
                  <>
                    <div className="auth-info__point">
                      <span className="auth-info__point-mark">01</span>
                      <div>
                        <strong>Stay in control</strong>
                        <p>Keep inventory information organized and easy to access.</p>
                      </div>
                    </div>

                    <div className="auth-info__point">
                      <span className="auth-info__point-mark">02</span>
                      <div>
                        <strong>Work from one place</strong>
                        <p>Connect your everyday inventory workflow in one workspace.</p>
                      </div>
                    </div>

                    <div className="auth-info__point">
                      <span className="auth-info__point-mark">03</span>
                      <div>
                        <strong>Move with confidence</strong>
                        <p>Make day-to-day stock decisions with better visibility.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="auth-info__point">
                      <span className="auth-info__point-mark">01</span>
                      <div>
                        <strong>One organized workspace</strong>
                        <p>Bring products, stock and warehouse activity together.</p>
                      </div>
                    </div>

                    <div className="auth-info__point">
                      <span className="auth-info__point-mark">02</span>
                      <div>
                        <strong>Ready for your team</strong>
                        <p>Create your account and prepare for admin approval.</p>
                      </div>
                    </div>

                    <div className="auth-info__point">
                      <span className="auth-info__point-mark">03</span>
                      <div>
                        <strong>Designed to scale</strong>
                        <p>Use a clean foundation that can grow with your operation.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="auth-form-section">
              <div className="auth-heading">
                <span className="auth-eyebrow">
                  {isLogin ? "Welcome back" : "Create your account"}
                </span>

                <h1>{title}</h1>

                <p>{subtitle}</p>
              </div>

              {children}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AuthShell;