
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
  Package,
} from "lucide-react";

import {
  isGeneralExpensesUnlocked,
} from "../utils/generalAccess";

function BottomNav({ onTalk }) {
  const [premiumUnlocked, setPremiumUnlocked] =
    useState(() => isGeneralExpensesUnlocked());

  useEffect(() => {
    function refreshPremiumStatus() {
      setPremiumUnlocked(isGeneralExpensesUnlocked());
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

      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <Home size={21} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/history"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <History size={21} />
        <span>History</span>
      </NavLink>

      <button
        type="button"
        className="nav-item talk-nav-item"
        onClick={onTalk}
      >
        <Mic size={23} />
        <span>Talk</span>
      </button>

      <NavLink
        to="/ingredients"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <Package size={21} />
        <span>Ingredients</span>
      </NavLink>

      <NavLink
        to="/statistics"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <PieChart size={21} />
        <span>Statistics</span>
      </NavLink>

    </nav>
  );
}

export default BottomNav;
