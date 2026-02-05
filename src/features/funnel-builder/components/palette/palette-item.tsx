import type { NodeTemplate } from '../../constants';

interface PaletteItemProps {
  template: NodeTemplate;
  disabled?: boolean;
}

export function PaletteItem({ template, disabled = false }: PaletteItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/funnel-node', template.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      aria-label={
        disabled
          ? `${template.label} (already added)`
          : `Drag ${template.label} to canvas`
      }
      aria-disabled={disabled}
      className={`
        flex items-center gap-3 p-3
        bg-[var(--background)]
        border border-[var(--border)]
        rounded-[var(--radius-md)]
        transition-all duration-[var(--transition-fast)]
        select-none
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-grab active:cursor-grabbing hover:border-[var(--primary)] hover:shadow-[var(--shadow-sm)]'
        }
      `}
      style={{ borderLeftColor: template.color, borderLeftWidth: 4 }}
    >
      <span className="text-xl" aria-hidden="true">
        {template.icon}
      </span>
      <div className="flex flex-col">
        <span className="font-medium text-sm">{template.label}</span>
        {disabled && (
          <span className="text-xs text-[var(--muted-foreground)]">
            Already added
          </span>
        )}
      </div>
    </div>
  );
}
