import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PreviewDialogProps {
  open: boolean;
  base64Data: string | null;
  onRetake: () => void;
  onSubmit: () => void;
}

export function PreviewDialog({ open, base64Data, onRetake, onSubmit }: PreviewDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="glass-strong border-none p-0 overflow-hidden sm:max-w-[340px] !rounded-[28px] [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Review captured frame</DialogTitle>
        <div className="flex flex-col">
          <div className="pt-5 pb-3 px-5 flex items-center justify-between border-b border-[rgba(84,84,88,0.45)]">
            <div className="face-title text-[15px]">Review Tangkapan</div>
            <span className="kbd-mono text-[10px]">Konfirmasi sebelum kirim</span>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {base64Data && (
              <img
                src={`data:image/jpeg;base64,${base64Data}`}
                alt="Captured preview"
                className="w-full aspect-square object-cover rounded-[16px] border border-[rgba(255,255,255,0.08)]"
                draggable={false}
              />
            )}
            <div className="flex flex-col gap-2">
              <button type="button" className="btn-primary" onClick={onSubmit}>
                Kirim ke Server
              </button>
              <button type="button" className="btn-ghost" onClick={onRetake}>
                Ambil Ulang
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
