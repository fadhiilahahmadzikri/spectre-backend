import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import {
  ResourceGridSkeleton,
  TableRowsSkeleton,
  FormSkeleton,
  DashboardCardsSkeleton,
} from "../index";

afterEach(() => cleanup());

describe("Skeleton kit", () => {
  it("ResourceGridSkeleton renders N cards (default 8)", () => {
    const { container } = render(<ResourceGridSkeleton />);
    const cards = container.querySelectorAll(".glass.rounded-\\[var\\(--radius-card\\,18px\\)\\]");
    expect(cards.length).toBe(8);
  });

  it("ResourceGridSkeleton accepts a count override", () => {
    const { container } = render(<ResourceGridSkeleton count={3} />);
    const cards = container.querySelectorAll(".glass.rounded-\\[var\\(--radius-card\\,18px\\)\\]");
    expect(cards.length).toBe(3);
  });

  it("TableRowsSkeleton renders rows × columns inside a <table>", () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowsSkeleton count={2} columns={3} />
        </tbody>
      </table>,
    );
    const rows = container.querySelectorAll("tr");
    expect(rows.length).toBe(2);
    expect(rows[0].querySelectorAll("td").length).toBe(3);
  });

  it("FormSkeleton renders N label+input pairs", () => {
    const { container } = render(<FormSkeleton rows={3} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(6); // 3 labels + 3 inputs
  });

  it("DashboardCardsSkeleton renders default 3 cards", () => {
    const { container } = render(<DashboardCardsSkeleton />);
    const cards = container.querySelectorAll(".glass");
    expect(cards.length).toBe(3);
  });
});
