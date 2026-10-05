// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoadingState, EmptyState, ErrorState } from "../src/components/common/StatusStates";

describe("status components", () => {
  it("LoadingState exposes a live status region with its label", () => {
    render(<LoadingState label="Building your itinerary…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Building your itinerary…");
  });

  it("ErrorState is announced as an alert and offers a working retry", async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Couldn't generate an itinerary." onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't generate an itinerary.");
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("ErrorState hides the retry button when no handler is given", () => {
    render(<ErrorState message="Nope" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("EmptyState renders its title, message and action", () => {
    render(<EmptyState title="No matches" message="Try another search." action={<button>Reset</button>} />);
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByText("Try another search.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });
});
