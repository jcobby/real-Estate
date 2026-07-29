import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

// Every test starts from a clean mock database.
beforeEach(() => {
  window.localStorage.clear();
});
