import { useEffect, useState } from "react";

import { api } from "../api";
import {
  getCurrentUser,
  setCurrentUser,
} from "../components/auth/session";

function generateOtp() {
  return String(
    Math.floor(
      1000 +
        Math.random() * 9000
    )
  );
}

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Settings() {
  const user =
    getCurrentUser();

  const [profileName, setProfileName] =
    useState(user?.name || "");

  const [profilePhone, setProfilePhone] =
    useState(user?.phone || "");

  const [profileError, setProfileError] =
    useState("");

  const [profileMessage, setProfileMessage] =
    useState("");

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [accountStatus, setAccountStatus] =
    useState("");

  const [memberSince, setMemberSince] =
    useState(null);

  const [loadingAccount, setLoadingAccount] =
    useState(true);

  const [accountError, setAccountError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAccountInfo() {
      try {
        const info =
          await api.getMyAccountInfo();

        if (cancelled) return;

        setAccountStatus(
          info.status
        );
        setMemberSince(
          info.createdAt
        );
      } catch (err) {
        if (!cancelled) {
          setAccountError(
            err instanceof Error
              ? err.message
              : "Unable to load account info."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAccount(false);
        }
      }
    }

    loadAccountInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  const [notifyLowStock, setNotifyLowStock] =
    useState(true);

  const [notifyUserRequest, setNotifyUserRequest] =
    useState(true);

  const [notifyPurchase, setNotifyPurchase] =
    useState(true);

  const [notifyTask, setNotifyTask] =
    useState(true);

  const [loadingPrefs, setLoadingPrefs] =
    useState(true);

  const [savingPrefs, setSavingPrefs] =
    useState(false);

  const [prefsError, setPrefsError] =
    useState("");

  const [prefsMessage, setPrefsMessage] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const prefs =
          await api.getNotificationPreferences();

        if (cancelled) return;

        setNotifyLowStock(
          prefs.notifyLowStock
        );
        setNotifyUserRequest(
          prefs.notifyUserRequest
        );
        setNotifyPurchase(
          prefs.notifyPurchase
        );
        setNotifyTask(
          prefs.notifyTask
        );
      } catch (err) {
        if (!cancelled) {
          setPrefsError(
            err instanceof Error
              ? err.message
              : "Unable to load notification preferences."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPrefs(false);
        }
      }
    }

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSavePreferences() {
    setPrefsError("");
    setPrefsMessage("");
    setSavingPrefs(true);

    try {
      const result =
        await api.updateNotificationPreferences({
          notifyLowStock,
          notifyUserRequest,
          notifyPurchase,
          notifyTask,
        });

      setPrefsMessage(
        result.message ||
          "Notification preferences updated."
      );
    } catch (err) {
      setPrefsError(
        err instanceof Error
          ? err.message
          : "Unable to update notification preferences."
      );
    } finally {
      setSavingPrefs(false);
    }
  }

  const [email, setEmail] =
    useState(
      user?.email || ""
    );

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [generatedOtp, setGeneratedOtp] =
    useState("");

  const [otpVerified, setOtpVerified] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSaveProfile(
    event
  ) {
    event.preventDefault();

    setProfileError("");
    setProfileMessage("");

    const name = profileName.trim();
    const phone = profilePhone.trim();

    if (!name) {
      setProfileError(
        "Name is required."
      );
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setProfileError(
        "Phone number must be exactly 10 digits."
      );
      return;
    }

    setSavingProfile(true);

    try {
      const updated =
        await api.updateMyProfile(
          name,
          phone
        );

      // Keep the locally saved session in sync so the sidebar
      // and header show the new name right away.
      setCurrentUser({
        ...user,
        name: updated.name,
        phone: updated.phone,
      });

      setProfileMessage(
        "Profile updated successfully. Refresh the page to see your new name everywhere in the sidebar."
      );
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : "Unable to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  function validatePassword(
    password
  ) {
    if (
      password.length < 8
    ) {
      return "New password must be at least 8 characters.";
    }

    if (
      !/[A-Za-z]/.test(
        password
      )
    ) {
      return "New password must contain at least one letter.";
    }

    if (
      !/\d/.test(password)
    ) {
      return "New password must contain at least one number.";
    }

    if (
      !/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(
        password
      )
    ) {
      return "New password must contain at least one special character.";
    }

    return null;
  }

  function handleGenerateOtp() {
    setError("");
    setMessage("");

    if (
      !emailRegex.test(
        email.trim()
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (
      !currentPassword
    ) {
      setError(
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "New password and confirm password don't match."
      );
      return;
    }

    const passwordError =
      validatePassword(
        newPassword
      );

    if (passwordError) {
      setError(
        passwordError
      );
      return;
    }

    const newOtp =
      generateOtp();

    setGeneratedOtp(
      newOtp
    );

    setOtp("");

    setOtpVerified(
      false
    );

    window.alert(
      `Your OTP is: ${newOtp}`
    );
  }

  function handleVerifyOtp() {
    setError("");
    setMessage("");

    if (!generatedOtp) {
      setError(
        "Please generate OTP first."
      );
      return;
    }

    if (
      !/^\d{4}$/.test(
        otp
      )
    ) {
      setError(
        "OTP must be exactly 4 digits."
      );
      return;
    }

    if (
      otp !== generatedOtp
    ) {
      setOtpVerified(
        false
      );

      setError(
        "Incorrect OTP."
      );

      return;
    }

    setOtpVerified(
      true
    );

    setMessage(
      "OTP verified successfully."
    );
  }

  async function handleChangePassword(
    event
  ) {
    event.preventDefault();

    setError("");

    if (!otpVerified) {
      setError(
        "Please generate and verify the OTP first."
      );
      return;
    }

    try {
      setIsSubmitting(
        true
      );

      const result =
        await api.changePassword(
          email.trim(),
          currentPassword,
          newPassword
        );

      setMessage(
        result.message ||
          "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setOtp("");
      setGeneratedOtp("");
      setOtpVerified(
        false
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change password."
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  function resetOtp() {
    setGeneratedOtp("");
    setOtp("");
    setOtpVerified(
      false
    );
    setMessage("");
    setError("");
  }

  return (
    <>
      <div className="bg-white rounded-4 shadow p-4 mb-4">
        <h5 className="mb-4">
          My Profile
        </h5>

        <form
          onSubmit={
            handleSaveProfile
          }
          noValidate
        >
          {/* =================================================
              NAME
          ================================================== */}

          <div className="mb-3">
            <label
              htmlFor="profile-name"
              className="form-label"
            >
              Name
            </label>

            <input
              id="profile-name"
              type="text"
              className="form-control"
              value={profileName}
              onChange={(event) =>
                setProfileName(
                  event.target.value
                )
              }
              disabled={
                savingProfile
              }
              required
            />
          </div>

          {/* =================================================
              EMAIL (read-only — email is the login ID, changed
              only through the security/password flow)
          ================================================== */}

          <div className="mb-3 p-2 bg-light rounded-3 d-flex justify-content-between align-items-center">
            <div>
              <div className="text-muted small">
                Email (login ID)
              </div>
              <div>
                {user?.email || ""}
              </div>
            </div>
          </div>

          <div className="form-text mb-3">
            Email can't be changed here — it's your login ID.
          </div>

          {/* =================================================
              PHONE
          ================================================== */}

          <div className="mb-3">
            <label
              htmlFor="profile-phone"
              className="form-label"
            >
              Phone
            </label>

            <input
              id="profile-phone"
              type="text"
              inputMode="numeric"
              maxLength={10}
              className="form-control"
              placeholder="10-digit phone number"
              value={profilePhone}
              onChange={(event) =>
                setProfilePhone(
                  event.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              disabled={
                savingProfile
              }
              required
            />
          </div>

          {/* =================================================
              ROLE (read-only reference)
          ================================================== */}

          <div className="mb-4 p-2 bg-light rounded-3 d-flex justify-content-between align-items-center">
            <div>
              <div className="text-muted small">
                Role
              </div>
              <div>
                {user?.role || ""}
              </div>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================== */}

          {profileError && (
            <div
              className="alert alert-danger py-2"
              role="alert"
            >
              {profileError}
            </div>
          )}

          {/* =================================================
              MESSAGE
          ================================================== */}

          {profileMessage && (
            <div
              className="text-success small mb-3"
              role="alert"
            >
              {profileMessage}
            </div>
          )}

          {/* =================================================
              SAVE PROFILE
          ================================================== */}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              savingProfile
            }
          >
            {savingProfile
              ? "Saving..."
              : "Save Profile"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-4 shadow p-4 mb-4">
        <h5 className="mb-4">
          Account
        </h5>

        {loadingAccount ? (
          <div className="text-muted small">
            Loading...
          </div>
        ) : accountError ? (
          <div
            className="alert alert-danger py-2"
            role="alert"
          >
            {accountError}
          </div>
        ) : (
          <div className="row g-3">
            {/* =================================================
                ACCOUNT STATUS
            ================================================== */}

            <div className="col-md-6">
              <div className="p-2 bg-light rounded-3">
                <div className="text-muted small">
                  Account Status
                </div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      display: "inline-block",
                      backgroundColor:
                        accountStatus ===
                        "Approved"
                          ? "#198754"
                          : "#ffc107",
                    }}
                  />
                  {accountStatus}
                </div>
              </div>
            </div>

            {/* =================================================
                MEMBER SINCE
            ================================================== */}

            <div className="col-md-6">
              <div className="p-2 bg-light rounded-3">
                <div className="text-muted small">
                  Member Since
                </div>
                <div className="mt-1">
                  {memberSince
                    ? new Date(
                        memberSince
                      ).toLocaleDateString(
                        undefined,
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-4 shadow p-4 mb-4">
        <h5 className="mb-1">
          Notification Preferences
        </h5>

        <div className="text-muted small mb-4">
          Choose which alerts should be created for your account.
        </div>

        {loadingPrefs ? (
          <div className="text-muted small">
            Loading...
          </div>
        ) : (
          <>
            {/* =================================================
                LOW STOCK
            ================================================== */}

            <div className="form-check form-switch mb-3">
              <input
                id="pref-low-stock"
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={notifyLowStock}
                onChange={(event) =>
                  setNotifyLowStock(
                    event.target.checked
                  )
                }
                disabled={savingPrefs}
              />
              <label
                htmlFor="pref-low-stock"
                className="form-check-label"
              >
                Low stock / out-of-stock alerts
              </label>
            </div>

            {/* =================================================
                PURCHASE ORDERS
            ================================================== */}

            <div className="form-check form-switch mb-3">
              <input
                id="pref-purchase"
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={notifyPurchase}
                onChange={(event) =>
                  setNotifyPurchase(
                    event.target.checked
                  )
                }
                disabled={savingPrefs}
              />
              <label
                htmlFor="pref-purchase"
                className="form-check-label"
              >
                Purchase order alerts
              </label>
            </div>

            {/* =================================================
                TASKS
            ================================================== */}

            <div className="form-check form-switch mb-3">
              <input
                id="pref-task"
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={notifyTask}
                onChange={(event) =>
                  setNotifyTask(
                    event.target.checked
                  )
                }
                disabled={savingPrefs}
              />
              <label
                htmlFor="pref-task"
                className="form-check-label"
              >
                Task assignment alerts
              </label>
            </div>

            {/* =================================================
                USER REQUESTS (SuperAdmin only — harmless for
                other roles since they never receive this type)
            ================================================== */}

            <div className="form-check form-switch mb-3">
              <input
                id="pref-user-request"
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={notifyUserRequest}
                onChange={(event) =>
                  setNotifyUserRequest(
                    event.target.checked
                  )
                }
                disabled={savingPrefs}
              />
              <label
                htmlFor="pref-user-request"
                className="form-check-label"
              >
                New user signup requests
              </label>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {prefsError && (
              <div
                className="alert alert-danger py-2"
                role="alert"
              >
                {prefsError}
              </div>
            )}

            {/* =================================================
                MESSAGE
            ================================================== */}

            {prefsMessage && (
              <div
                className="text-success small mb-3"
                role="alert"
              >
                {prefsMessage}
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSavePreferences}
              disabled={savingPrefs}
            >
              {savingPrefs
                ? "Saving..."
                : "Save Preferences"}
            </button>
          </>
        )}
      </div>

      <div className="bg-white rounded-4 shadow p-4">
        <h5 className="mb-4">
          Change Password
        </h5>

        <form
          onSubmit={
            handleChangePassword
          }
          noValidate
        >
          {/* =================================================
              EMAIL
          ================================================== */}

          <div className="mb-3">
            <label
              htmlFor="settings-email"
              className="form-label"
            >
              Email
            </label>

            <input
              id="settings-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              disabled={
                isSubmitting
              }
              required
            />
          </div>

          {/* =================================================
              CURRENT PASSWORD
          ================================================== */}

          <div className="mb-3">
            <label
              htmlFor="current-password"
              className="form-label"
            >
              Current Password
            </label>

            <input
              id="current-password"
              type="password"
              className="form-control"
              value={
                currentPassword
              }
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value
                )
              }
              disabled={
                isSubmitting
              }
              required
            />
          </div>

          {/* =================================================
              NEW PASSWORD
          ================================================== */}

          <div className="mb-3">
            <label
              htmlFor="new-password"
              className="form-label"
            >
              New Password
            </label>

            <input
              id="new-password"
              type="password"
              className="form-control"
              placeholder="Min 8 chars, 1 letter, 1 number, 1 special char"
              value={
                newPassword
              }
              onChange={(event) =>
                setNewPassword(
                  event.target.value
                )
              }
              disabled={
                isSubmitting
              }
              required
            />
          </div>

          {/* =================================================
              CONFIRM PASSWORD
          ================================================== */}

          <div className="mb-3">
            <label
              htmlFor="confirm-password"
              className="form-label"
            >
              Confirm New Password
            </label>

            <input
              id="confirm-password"
              type="password"
              className="form-control"
              value={
                confirmPassword
              }
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              disabled={
                isSubmitting
              }
              required
            />
          </div>

          {/* =================================================
              OTP
          ================================================== */}

          <div className="mb-3">
            <label
              htmlFor="settings-otp"
              className="form-label"
            >
              OTP
            </label>

            <input
              id="settings-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              className="form-control"
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={(event) => {
                const value =
                  event.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(
                      0,
                      4
                    );

                setOtp(value);
                setOtpVerified(
                  false
                );
                setError("");
              }}
              disabled={
                isSubmitting
              }
            />
          </div>

          {/* =================================================
              OTP BUTTONS
          ================================================== */}

          <div className="d-flex gap-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-primary flex-grow-1"
              onClick={
                handleGenerateOtp
              }
              disabled={
                isSubmitting
              }
            >
              Generate OTP
            </button>

            <button
              type="button"
              className="btn btn-outline-success flex-grow-1"
              onClick={
                handleVerifyOtp
              }
              disabled={
                isSubmitting
              }
            >
              Verify OTP
            </button>
          </div>

          {/* =================================================
              ERROR
          ================================================== */}

          {error && (
            <div
              className="alert alert-danger py-2"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* =================================================
              MESSAGE
          ================================================== */}

          {message && (
            <div
              className="text-success small mb-3"
              role="alert"
            >
              {message}
            </div>
          )}

          {/* =================================================
              CHANGE PASSWORD
          ================================================== */}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              isSubmitting ||
              !otpVerified
            }
          >
            {isSubmitting
              ? "Changing..."
              : "Change Password"}
          </button>

          {generatedOtp && (
            <button
              type="button"
              className="btn btn-link ms-2"
              onClick={
                resetOtp
              }
              disabled={
                isSubmitting
              }
            >
              Generate new OTP
            </button>
          )}
        </form>
      </div>
    </>
  );
}