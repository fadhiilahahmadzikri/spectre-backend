import {
  GlassDialog,
  GlassDialogBody,
} from "@/shared/ui/GlassDialog";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { scan } from "@/shared/lib/copy";

interface PreviewDialogProps {
  open: boolean;
  base64Data: string | null;
  onRetake: () => void;
  onSubmit: () => void;
}

export function PreviewDialog({
  open,
  base64Data,
  onRetake,
  onSubmit,
}: PreviewDialogProps) {
  return (
    <GlassDialog
      open={open}
      onOpenChange={() => {
        /* scanner owns lifecycle; no-op on outside close */
      }}
      size="sm"
      showClose={false}
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
    >
      {/* Left-aligned header with subtitle, flush with the scanner visual
          language. sr-only'ed DialogTitle satisfies the a11y contract since
          the heading is styled via face-title directly. */}
      <div className="pt-5 pb-3 px-5 flex items-center justify-between border-b border-[rgba(84,84,88,0.45)]">
        <DialogTitle className="face-title text-[15px] font-normal">
          {scan.preview.title}
        </DialogTitle>
        <span className="kbd-mono text-[10px]">{scan.preview.subtitle}</span>
      </div>
      <GlassDialogBody className="!py-5">
        {base64Data && (
          <img
            src={`data:image/jpeg;base64,${base64Data}`}
            alt="Captured preview"
            className="w-full aspect-square object-cover rounded-[var(--radius-card,18px)] border border-[rgba(255,255,255,0.08)]"
            draggable={false}
          />
        )}
        <div className="flex flex-col gap-2">
          <Button type="button" variant="primary-glass" onClick={onSubmit}>
            {scan.preview.submit}
          </Button>
          <Button type="button" variant="ghost-glass" onClick={onRetake}>
            {scan.preview.retake}
          </Button>
        </div>
      </GlassDialogBody>
    </GlassDialog>
  );
}
