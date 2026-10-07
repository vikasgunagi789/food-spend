import {
  useEffect,
  useState,
} from "react";

import { NavLink } from "react-router-dom";

import {
  Home,
  History,
  PieChart,
  Mic,
  Settings,
  WalletCards,
} from "lucide-react";

import {
  isGeneralExpensesUnlocked,
} from "../utils/generalAccess";

function BottomNav({ onTalk }) {
  const [premiumUnlocked, setPremiumUnlocked] =
    useState(() =>
      isGeneralExpensesUnlocked()
    );

  useEffect(() => {
    function refreshPremiumStatus() {
      setPremiumUnlocked(
        isGeneralExpensesUnlocked()
      );
    }

    window.addEventListener(
      "general-expenses-unlocked",
      refreshPremiumStatus
    );

    window.addEventListener(
      "general-expenses-locked",
      refreshPremiumStatus
    );

    return () => {
      window.removeEventListener(
        "general-expenses-unlocked",
        refreshPremiumStatus
      );

      window.removeEventListener(
        "general-expenses-locked",
        refreshPremiumStatus
      );
    };
  }, []);

  return (
    <nav className="bottom-nav">

      {/* HOME */}
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive
            ? "nav-item active"
            : "nav-item"
        }
      >
        <Home size={21} />

        <span>
          Home
        </span>
      </NavLink>


      {/* HISTORY */}
      <NavLink
        to="/history"
        className={({ isActive }) =>
          isActive
            ? "nav-item active"
            : "nav-item"
        }
      >
        <History size={21} />

        <span>
          History
        </span>
      </NavLink>


      {/* TALK */}
      <button
        type="button"
        className="nav-item talk-nav-item"
        onClick={onTalk}
      >
        <Mic size={23} />

        <span>
          Talk
        </span>
      </button>


      {/* STATISTICS */}
      <NavLink
        to="/statistics"
        className={({ isActive }) =>
          isActive
            ? "nav-item active"
            : "nav-item"
        }
      >
        <PieChart size={21} />

        <span>
          Statistics
        </span>
      </NavLink>


      {/* PREMIUM:
          GENERAL EXPENSES
      */}
      {premiumUnlocked && (
        <NavLink
          to="/general-expenses"
          className={({ isActive }) =>
            isActive
              ? "nav-item active general-nav-item"
              : "nav-item general-nav-item"
          }
        >
          <WalletCards size={21} />

          <span>
            General
          </span>
        </NavLink>
      )}


      {/* NON-PREMIUM:
          SETTINGS STAYS IN BOTTOM NAV
      */}
      {!premiumUnlocked && (
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive
              ? "nav-item active"
              : "nav-item"
          }
        >
          <Settings size={21} />

          <span>
            Settings
          </span>
        </NavLink>
      )}

    </nav>
  );
}

export default BottomNav;