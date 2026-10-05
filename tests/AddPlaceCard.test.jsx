// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddPlaceCard } from "../src/components/itinerary/AddPlaceCard";

describe("<AddPlaceCard />", () => {
  it("disables submit until something is typed", async () => {
    render(<AddPlaceCard onSubmit={() => {}} status="idle" />);
    const button = screen.getByRole("button", { name: /add to itinerary/i });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/place to add/i), "Nishiki Market");
    expect(button).toBeEnabled();
  });

  it("submits the trimmed place name and clears the field", async () => {
    const onSubmit = vi.fn();
    render(<AddPlaceCard onSubmit={onSubmit} status="idle" />);

    const input = screen.getByLabelText(/place to add/i);
    await userEvent.type(input, "  Nishiki Market  ");
    await userEvent.click(screen.getByRole("button", { name: /add to itinerary/i }));

    expect(onSubmit).toHaveBeenCalledWith("Nishiki Market");
    expect(input).toHaveValue("");
  });

  it("limits the place name length to match the server-side limit", () => {
    render(<AddPlaceCard onSubmit={() => {}} status="idle" />);
    expect(screen.getByLabelText(/place to add/i)).toHaveAttribute("maxlength", "80");
  });

  it("announces errors to assistive tech", () => {
    render(<AddPlaceCard onSubmit={() => {}} status="error" errorMessage="Couldn't add that place." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't add that place.");
  });

  it("locks the form while a request is in flight", () => {
    render(<AddPlaceCard onSubmit={() => {}} status="loading" />);
    expect(screen.getByLabelText(/place to add/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /adding/i })).toBeDisabled();
  });
});
