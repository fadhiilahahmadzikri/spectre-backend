import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

afterEach(() => cleanup());

describe("EmptyState", () => {
  it("renders compact variant (default)", () => {
    render(<EmptyState title="Nothing here" description="Try again later" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Try again later")).toBeInTheDocument();
  });

  it("renders inline variant with same small icon", () => {
    const { container } = render(
      <EmptyState variant="inline" title="Inline" />,
    );
    // Inline drops top padding — className on root should not contain py-8
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toMatch(/\bpy-8\b/);
    expect(root.className).toMatch(/\bpb-8\b/);
  });

  it("renders full variant with glass-strong card and action", () => {
    const { container } = render(
      <EmptyState
        variant="full"
        title="No apps"
        description="Create one"
        action={<button type="button">Create</button>}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("glass-strong");
    expect(root.className).toContain("rounded-");
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("backward-compatible compact prop still works", () => {
    const { container } = render(<EmptyState compact title="Tight" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toMatch(/\bpy-8\b/);
  });
});
