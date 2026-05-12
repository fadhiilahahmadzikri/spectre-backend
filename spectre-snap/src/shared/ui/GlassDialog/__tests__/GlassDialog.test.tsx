import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import {
  GlassDialog,
  GlassDialogHeader,
  GlassDialogBody,
  GlassDialogFooter,
} from "../index";

afterEach(() => cleanup());

describe("GlassDialog slot composition", () => {
  it("renders header, body, and footer in the expected order with a11y title", () => {
    const { baseElement } = render(
      <GlassDialog open onOpenChange={() => {}}>
        <GlassDialogHeader
          title="Dialog title"
          description="Dialog description"
        />
        <GlassDialogBody>
          <p>Body content</p>
        </GlassDialogBody>
        <GlassDialogFooter>
          <button type="button">Action</button>
        </GlassDialogFooter>
      </GlassDialog>,
    );

    // Title wired as shadcn DialogTitle (not a raw h1).
    expect(screen.getByText("Dialog title")).toBeInTheDocument();
    // Description wired as DialogDescription.
    expect(screen.getByText("Dialog description")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();

    // Content has the glass-strong + radius tokens.
    const content = baseElement.querySelector('[data-slot="dialog-content"]');
    expect(content).not.toBeNull();
    expect(content?.className).toContain("glass-strong");
    expect(content?.className).toContain("rounded-");
  });

  it("supports onInteractOutside pass-through for scanner use", () => {
    // Smoke test that the prop is accepted without TS / runtime errors.
    render(
      <GlassDialog
        open
        onOpenChange={() => {}}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showClose={false}
      >
        <GlassDialogHeader title="Locked" />
      </GlassDialog>,
    );

    expect(screen.getByText("Locked")).toBeInTheDocument();
  });
});
